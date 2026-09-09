import "server-only";

import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import {
  assertMemorialDraftCapability,
  isMemorialTransactionConflict,
  MemorialUploadError,
} from "@/lib/memorialUpload";

const ACTIVE_ATTEMPT_STATES = ["CREATING", "OPEN"];
// Stripe requires expires_at to be at least 30 minutes in the future. The
// extra minute absorbs time spent in the durable pre-provider transaction.
const CHECKOUT_TTL_MS = 31 * 60 * 1000;
const MAX_TRANSACTION_ATTEMPTS = 3;

export function getCanonicalAppOrigin() {
  const configured = String(process.env.NEXT_PUBLIC_APP_URL || "").trim();

  let url;
  try {
    url = new URL(configured);
  } catch {
    throw new MemorialUploadError(
      "Memorial checkout is not configured.",
      503,
      { code: "CHECKOUT_CONFIGURATION_ERROR" }
    );
  }

  const isLocalDevelopment =
    process.env.NODE_ENV !== "production" &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  const isCanonicalHttps = url.protocol === "https:";

  if (
    (!isCanonicalHttps && !isLocalDevelopment) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new MemorialUploadError(
      "Memorial checkout is not configured.",
      503,
      { code: "CHECKOUT_CONFIGURATION_ERROR" }
    );
  }

  return url.origin;
}

function assertCheckoutContent(memorial) {
  if (
    !Number.isInteger(memorial.donationAmountCents) ||
    memorial.donationAmountCents < 300
  ) {
    throw new MemorialUploadError(
      "This memorial does not have a valid donation amount.",
      400
    );
  }

  if (memorial.images.length === 0) {
    throw new MemorialUploadError(
      "Please upload at least one memorial photo before checkout.",
      400
    );
  }
}

async function prepareAttemptTransaction(
  transaction,
  memorialId,
  draftCapability
) {
  const now = new Date();
  const memorial = await transaction.petMemorial.findUnique({
    where: { id: memorialId },
    include: {
      images: {
        where: { deletedAt: null },
        select: {
          id: true,
          imageUrl: true,
          isCover: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  assertMemorialDraftCapability(memorial, draftCapability, {
    allowedStatuses: ["DRAFT", "PENDING_PAYMENT"],
  });
  assertCheckoutContent(memorial);

  const expiredReservations =
    await transaction.petMemorialUploadReservation.findMany({
      where: {
        memorialId,
        state: "PENDING",
        finalizationDeadline: { lt: now },
      },
      select: { id: true, publicId: true },
    });

  if (expiredReservations.length > 0) {
    await transaction.petMemorialUploadReservation.updateMany({
      where: {
        id: { in: expiredReservations.map(({ id }) => id) },
        state: "PENDING",
      },
      data: {
        state: "REVIEW_REQUIRED",
        reviewRequiredAt: now,
        reviewReason: "CHECKOUT_AFTER_RESERVATION_EXPIRED",
      },
    });
  }

  const pendingReservations =
    await transaction.petMemorialUploadReservation.count({
      where: { memorialId, state: "PENDING" },
    });

  if (pendingReservations > 0) {
    throw new MemorialUploadError(
      "Please wait for all memorial photos to finish before checkout.",
      409
    );
  }

  let activeAttempt =
    await transaction.petMemorialCheckoutAttempt.findUnique({
      where: { activeMemorialId: memorialId },
    });
  const obsoleteSessionIds = [];

  if (
    activeAttempt &&
    activeAttempt.stripeSessionExpiresAt.getTime() <= now.getTime()
  ) {
    const retired = await transaction.petMemorialCheckoutAttempt.updateMany({
      where: {
        id: activeAttempt.id,
        activeMemorialId: memorialId,
        state: { in: ACTIVE_ATTEMPT_STATES },
      },
      data: {
        state: "EXPIRED",
        activeMemorialId: null,
        invalidatedAt: now,
      },
    });

    if (retired.count !== 1) {
      throw new MemorialUploadError(
        "Checkout state changed while an expired attempt was retiring.",
        409,
        { code: "CHECKOUT_STATE_CHANGED" }
      );
    }

    if (activeAttempt.stripeSessionId) {
      obsoleteSessionIds.push(activeAttempt.stripeSessionId);
      await transaction.petMemorial.updateMany({
        where: {
          id: memorialId,
          stripeSessionId: activeAttempt.stripeSessionId,
          status: { in: ["DRAFT", "PENDING_PAYMENT"] },
        },
        data: { stripeSessionId: null },
      });
    }

    activeAttempt = null;
  }

  const currency = String(memorial.currency || "usd").toLowerCase();

  if (activeAttempt) {
    if (
      activeAttempt.amountCents !== memorial.donationAmountCents ||
      activeAttempt.currency !== currency
    ) {
      throw new MemorialUploadError(
        "The memorial changed after checkout began.",
        409,
        { code: "CHECKOUT_ATTEMPT_MISMATCH" }
      );
    }

    return {
      memorial,
      attempt: activeAttempt,
      expiredReservations,
      obsoleteSessionIds,
    };
  }

  if (memorial.stripeSessionId) {
    throw new MemorialUploadError(
      "A checkout session already exists for this memorial.",
      409,
      { code: "LEGACY_CHECKOUT_SESSION_ACTIVE" }
    );
  }

  const frozen = await transaction.petMemorial.updateMany({
    where: {
      id: memorialId,
      deletedAt: null,
      status: { in: ["DRAFT", "PENDING_PAYMENT"] },
      draftCapabilityHash: memorial.draftCapabilityHash,
      draftCapabilityInvalidatedAt: null,
      draftCapabilityExpiresAt: { gte: now },
    },
    data: { status: "PENDING_PAYMENT" },
  });

  if (frozen.count !== 1) {
    throw new MemorialUploadError(
      "The memorial changed before checkout could begin.",
      409
    );
  }

  const attempt = await transaction.petMemorialCheckoutAttempt.create({
    data: {
      memorialId,
      activeMemorialId: memorialId,
      state: "CREATING",
      idempotencyKey: randomUUID(),
      amountCents: memorial.donationAmountCents,
      currency,
      stripeSessionExpiresAt: new Date(now.getTime() + CHECKOUT_TTL_MS),
    },
  });

  return { memorial, attempt, expiredReservations, obsoleteSessionIds };
}

export async function prepareMemorialCheckoutAttempt(
  memorialId,
  draftCapability
) {
  for (let transactionAttempt = 1; ; transactionAttempt += 1) {
    try {
      return await prisma.$transaction(
        (transaction) =>
          prepareAttemptTransaction(
            transaction,
            memorialId,
            draftCapability
          ),
        { isolationLevel: "Serializable" }
      );
    } catch (error) {
      const retryable =
        isMemorialTransactionConflict(error) || error?.code === "P2002";

      if (retryable && transactionAttempt < MAX_TRANSACTION_ATTEMPTS) {
        continue;
      }

      if (retryable) {
        throw new MemorialUploadError(
          "The memorial changed while checkout was starting. Please retry.",
          409
        );
      }

      throw error;
    }
  }
}

export async function activateMemorialCheckoutAttempt({
  attemptId,
  memorialId,
  draftCapability,
  session,
}) {
  return prisma.$transaction(
    async (transaction) => {
      const [attempt, memorial] = await Promise.all([
        transaction.petMemorialCheckoutAttempt.findUnique({
          where: { id: attemptId },
        }),
        transaction.petMemorial.findUnique({ where: { id: memorialId } }),
      ]);

      assertMemorialDraftCapability(memorial, draftCapability, {
        allowedStatuses: ["DRAFT", "PENDING_PAYMENT"],
      });

      const sessionAmount = Number(session?.amount_total);
      const sessionCurrency = String(session?.currency || "").toLowerCase();
      const metadata = session?.metadata || {};
      const sessionExpiresAt = new Date(Number(session?.expires_at) * 1000);
      const matches =
        attempt &&
        attempt.memorialId === memorialId &&
        attempt.activeMemorialId === memorialId &&
        ACTIVE_ATTEMPT_STATES.includes(attempt.state) &&
        (!attempt.stripeSessionId || attempt.stripeSessionId === session?.id) &&
        session?.mode === "payment" &&
        typeof session?.url === "string" &&
        session.url.length > 0 &&
        metadata.paymentType === "memorial" &&
        metadata.memorialId === memorialId &&
        metadata.checkoutAttemptId === attemptId &&
        sessionAmount === attempt.amountCents &&
        sessionCurrency === attempt.currency &&
        Number.isFinite(sessionExpiresAt.getTime()) &&
        sessionExpiresAt.getTime() > Date.now();

      if (!matches) {
        throw new MemorialUploadError(
          "The checkout session did not match this memorial.",
          409,
          { code: "CHECKOUT_SESSION_MISMATCH" }
        );
      }

      const activated =
        await transaction.petMemorialCheckoutAttempt.updateMany({
          where: {
            id: attemptId,
            memorialId,
            activeMemorialId: memorialId,
            state: { in: ACTIVE_ATTEMPT_STATES },
            OR: [{ stripeSessionId: null }, { stripeSessionId: session.id }],
          },
          data: {
            state: "OPEN",
            stripeSessionId: session.id,
            stripeSessionExpiresAt: sessionExpiresAt,
          },
        });

      const linked = await transaction.petMemorial.updateMany({
        where: {
          id: memorialId,
          deletedAt: null,
          status: { in: ["DRAFT", "PENDING_PAYMENT"] },
          draftCapabilityInvalidatedAt: null,
        },
        data: {
          status: "PENDING_PAYMENT",
          stripeSessionId: session.id,
        },
      });

      if (activated.count !== 1 || linked.count !== 1) {
        throw new MemorialUploadError(
          "The memorial changed before checkout could be activated.",
          409,
          { code: "CHECKOUT_STATE_CHANGED" }
        );
      }

      return session;
    },
    { isolationLevel: "Serializable" }
  );
}

export async function expireMemorialCheckoutAttempt(attemptId) {
  return prisma.$transaction(
    async (transaction) => {
      const attempt = await transaction.petMemorialCheckoutAttempt.findUnique({
        where: { id: attemptId },
      });

      if (!attempt || !ACTIVE_ATTEMPT_STATES.includes(attempt.state)) {
        return attempt?.stripeSessionId || null;
      }

      const now = new Date();
      const expired = await transaction.petMemorialCheckoutAttempt.updateMany({
        where: {
          id: attemptId,
          activeMemorialId: attempt.memorialId,
          state: { in: ACTIVE_ATTEMPT_STATES },
        },
        data: {
          state: "EXPIRED",
          activeMemorialId: null,
          invalidatedAt: now,
        },
      });

      if (expired.count === 1 && attempt.stripeSessionId) {
        await transaction.petMemorial.updateMany({
          where: {
            id: attempt.memorialId,
            stripeSessionId: attempt.stripeSessionId,
            status: { in: ["DRAFT", "PENDING_PAYMENT"] },
          },
          data: { stripeSessionId: null },
        });
      }

      return attempt.stripeSessionId || null;
    },
    { isolationLevel: "Serializable" }
  );
}

export async function bestEffortExpireMemorialCheckoutSession(sessionId) {
  if (!sessionId) {
    return false;
  }

  try {
    const { getMemorialStripe } = await import("@/lib/memorialStripe");
    const memorialStripe = getMemorialStripe();
    await memorialStripe.checkout.sessions.expire(sessionId);
    return true;
  } catch {
    return false;
  }
}
