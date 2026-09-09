export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getMemorialStripe,
  MemorialStripeConfigurationError,
} from "@/lib/memorialStripe";

function stringId(value) {
  if (typeof value === "string") {
    return value;
  }

  return typeof value?.id === "string" ? value.id : null;
}

function stripeTimestamp(seconds) {
  const value = Number(seconds);
  const date = new Date(value * 1000);
  return Number.isFinite(value) && Number.isFinite(date.getTime())
    ? date
    : null;
}

function isEventLedgerDuplicate(error) {
  const target = Array.isArray(error?.meta?.target)
    ? error.meta.target.join(",")
    : String(error?.meta?.target || "");

  return error?.code === "P2002" && target.includes("stripeEventId");
}

function paymentReviewReason({
  attemptState,
  supersededAttempt,
  memorial,
  priorReviewReason,
}) {
  if (attemptState === "EXPIRED") {
    return "LATE_PAYMENT_EXPIRED_ATTEMPT";
  }

  if (attemptState === "INVALIDATED") {
    return "LATE_PAYMENT_INVALIDATED_ATTEMPT";
  }

  if (supersededAttempt) {
    return "LATE_PAYMENT_SUPERSEDED_ATTEMPT";
  }

  if (priorReviewReason) {
    return priorReviewReason;
  }

  if (memorial.deletedAt) {
    return "PAYMENT_FOR_DELETED_MEMORIAL";
  }

  if (["REJECTED", "REFUNDED", "EXPIRED"].includes(memorial.status)) {
    return `PAYMENT_FOR_${memorial.status}_MEMORIAL`;
  }

  return null;
}

async function finishLedgerEvent(transaction, ledgerId, state, result, data) {
  await transaction.memorialStripeEvent.update({
    where: { id: ledgerId },
    data: {
      state,
      result,
      processedAt: new Date(),
      ...data,
    },
  });
}

async function processVerifiedEvent(event) {
  return prisma.$transaction(
    async (transaction) => {
      const session = event.type === "checkout.session.completed"
        ? event.data.object
        : null;
      const sessionId = stringId(session?.id);
      const memorialId = String(session?.metadata?.memorialId || "").trim();
      const checkoutAttemptId = String(
        session?.metadata?.checkoutAttemptId || ""
      ).trim();
      const ledger = await transaction.memorialStripeEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
          state: "PROCESSING",
          memorialId: memorialId || null,
          stripeSessionId: sessionId,
          stripeCreatedAt: stripeTimestamp(event.created),
        },
      });

      if (event.type !== "checkout.session.completed") {
        await finishLedgerEvent(
          transaction,
          ledger.id,
          "IGNORED",
          "EVENT_TYPE_NOT_HANDLED"
        );
        return "ignored";
      }

      const paymentType = String(session?.metadata?.paymentType || "").trim();
      const amountCents = Number(session?.amount_total);
      const currency = String(session?.currency || "").toLowerCase();
      const paymentIntentId = stringId(session?.payment_intent);
      const validEnvelope =
        paymentType === "memorial" &&
        memorialId &&
        sessionId &&
        session?.mode === "payment" &&
        session?.payment_status === "paid" &&
        Number.isInteger(amountCents) &&
        amountCents > 0 &&
        /^[a-z]{3}$/.test(currency);

      if (!validEnvelope) {
        await finishLedgerEvent(
          transaction,
          ledger.id,
          paymentType === "memorial" ? "REVIEW_REQUIRED" : "IGNORED",
          paymentType === "memorial"
            ? "INVALID_COMPLETED_SESSION"
            : "UNRELATED_CHECKOUT_SESSION"
        );
        return "not-applicable";
      }

      const memorial = await transaction.petMemorial.findUnique({
        where: { id: memorialId },
      });

      if (!memorial) {
        await finishLedgerEvent(
          transaction,
          ledger.id,
          "REVIEW_REQUIRED",
          "MEMORIAL_NOT_FOUND"
        );
        return "review";
      }

      let attempt = null;

      if (checkoutAttemptId) {
        attempt = await transaction.petMemorialCheckoutAttempt.findUnique({
          where: { id: checkoutAttemptId },
        });

        const attemptMatches =
          attempt &&
          attempt.memorialId === memorialId &&
          (!attempt.stripeSessionId || attempt.stripeSessionId === sessionId) &&
          attempt.amountCents === amountCents &&
          attempt.currency === currency;

        if (!attemptMatches) {
          await finishLedgerEvent(
            transaction,
            ledger.id,
            "REVIEW_REQUIRED",
            "CHECKOUT_ATTEMPT_MISMATCH"
          );
          return "review";
        }
      } else {
        const legacyMatches =
          memorial.stripeSessionId === sessionId &&
          memorial.donationAmountCents === amountCents &&
          String(memorial.currency || "").toLowerCase() === currency;

        if (!legacyMatches) {
          await finishLedgerEvent(
            transaction,
            ledger.id,
            "REVIEW_REQUIRED",
            "LEGACY_SESSION_MISMATCH"
          );
          return "review";
        }
      }

      const activeAttempt =
        await transaction.petMemorialCheckoutAttempt.findUnique({
          where: { activeMemorialId: memorialId },
        });
      const supersededAttempt =
        activeAttempt && activeAttempt.id !== attempt?.id
          ? activeAttempt
          : null;
      const memorialSessionBelongsToSupersededAttempt =
        supersededAttempt?.stripeSessionId &&
        supersededAttempt.stripeSessionId === memorial.stripeSessionId;

      const conflictingMemorial = await transaction.petMemorial.findFirst({
        where: {
          id: { not: memorialId },
          OR: [
            { stripeSessionId: sessionId },
            ...(paymentIntentId
              ? [{ stripePaymentIntentId: paymentIntentId }]
              : []),
          ],
        },
        select: { id: true },
      });
      const localIdentifierMismatch =
        (memorial.stripeSessionId &&
          memorial.stripeSessionId !== sessionId &&
          !memorialSessionBelongsToSupersededAttempt) ||
        (paymentIntentId &&
          memorial.stripePaymentIntentId &&
          memorial.stripePaymentIntentId !== paymentIntentId);

      if (conflictingMemorial || localIdentifierMismatch) {
        await finishLedgerEvent(
          transaction,
          ledger.id,
          "REVIEW_REQUIRED",
          "PAYMENT_IDENTIFIER_CONFLICT"
        );
        return "review";
      }

      const paidAt = stripeTimestamp(event.created) || new Date();
      const attemptStateAtPayment = attempt?.state || null;
      const alreadyCompleted = attemptStateAtPayment === "COMPLETED";
      const priorAttemptReview = attempt
        ? await transaction.memorialStripeEvent.findFirst({
            where: {
              checkoutAttemptId: attempt.id,
              state: "REVIEW_REQUIRED",
            },
            orderBy: { createdAt: "asc" },
            select: { result: true },
          })
        : null;
      const reviewReason = paymentReviewReason({
        attemptState: attemptStateAtPayment,
        supersededAttempt,
        memorial,
        priorReviewReason: priorAttemptReview?.result || null,
      });

      if (supersededAttempt) {
        await transaction.petMemorialCheckoutAttempt.updateMany({
          where: {
            id: supersededAttempt.id,
            activeMemorialId: memorialId,
            state: { in: ["CREATING", "OPEN"] },
          },
          data: {
            state: "INVALIDATED",
            activeMemorialId: null,
            invalidatedAt: paidAt,
          },
        });
      }

      if (attempt && !alreadyCompleted) {
        await transaction.petMemorialCheckoutAttempt.update({
          where: { id: attempt.id },
          data: {
            state: "COMPLETED",
            activeMemorialId: null,
            stripeSessionId: sessionId,
            completedAt: paidAt,
          },
        });
      }

      const advancesToPaid = ["DRAFT", "PENDING_PAYMENT"].includes(
        memorial.status
      );
      const requiresReview = Boolean(reviewReason);

      await transaction.petMemorial.update({
        where: { id: memorialId },
        data: {
          ...(advancesToPaid ? { status: "PAID" } : {}),
          ...(memorial.paidAt ? {} : { paidAt }),
          ...(memorial.draftCapabilityInvalidatedAt
            ? {}
            : { draftCapabilityInvalidatedAt: paidAt }),
          ...(!memorial.stripeSessionId ||
          memorialSessionBelongsToSupersededAttempt
            ? { stripeSessionId: sessionId }
            : {}),
          ...(paymentIntentId && !memorial.stripePaymentIntentId
            ? { stripePaymentIntentId: paymentIntentId }
            : {}),
        },
      });

      const result = reviewReason
        ? reviewReason
        : alreadyCompleted
          ? "ALREADY_COMPLETED"
          : advancesToPaid
            ? "MEMORIAL_MARKED_PAID"
            : "PAYMENT_ALREADY_RECORDED";

      await finishLedgerEvent(
        transaction,
        ledger.id,
        requiresReview ? "REVIEW_REQUIRED" : "PROCESSED",
        result,
        {
          memorialId,
          checkoutAttemptId: attempt?.id || null,
          stripeSessionId: sessionId,
        }
      );

      return {
        result,
        obsoleteSessionId: supersededAttempt?.stripeSessionId || null,
      };
    },
    { isolationLevel: "Serializable" }
  );
}

export async function POST(request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let memorialStripe;
  let webhookSecret;

  try {
    memorialStripe = getMemorialStripe();
    webhookSecret = process.env.MEMORIAL_STRIPE_WEBHOOK_SECRET?.trim();

    if (!webhookSecret) {
      throw new MemorialStripeConfigurationError();
    }
  } catch (error) {
    if (!(error instanceof MemorialStripeConfigurationError)) {
      throw error;
    }

    console.error("[memorial-stripe-webhook] Webhook is not configured.");
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 503 }
    );
  }

  let event;

  try {
    event = memorialStripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret
    );
  } catch {
    console.error("[memorial-stripe-webhook] Signature verification failed.");
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  try {
    const processed = await processVerifiedEvent(event);

    if (processed?.obsoleteSessionId) {
      try {
        await memorialStripe.checkout.sessions.expire(
          processed.obsoleteSessionId
        );
      } catch {
        // The durable attempt is already invalidated. Expiration is best effort.
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (isEventLedgerDuplicate(error)) {
      return NextResponse.json({ received: true });
    }

    console.error("[memorial-stripe-webhook] Event processing failed.", {
      eventId: event?.id,
      eventType: event?.type,
    });
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
