export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { bestEffortExpireMemorialCheckoutSession } from "@/lib/memorialCheckout";

const MAX_DELETE_TRANSACTION_ATTEMPTS = 3;
const PAYMENT_PROTECTED_STATUSES = new Set([
  "PAID",
  "IN_REVIEW",
  "PUBLISHED",
]);
const PAYMENT_DELETE_ERROR =
  "Paid memorials require payment review or refund handling before deletion.";

function paymentRequiresReviewBeforeDeletion(memorial, hasPaymentConflict) {
  if (hasPaymentConflict) {
    return true;
  }

  if (PAYMENT_PROTECTED_STATUSES.has(memorial.status)) {
    return true;
  }

  return Boolean(memorial.paidAt);
}

async function deleteMemorialTransaction(id) {
  return prisma.$transaction(
    async (transaction) => {
      const existing = await transaction.petMemorial.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          paidAt: true,
          stripeSessionId: true,
        },
      });

      if (!existing) {
        return { kind: "not-found" };
      }

      const paymentConflictCount =
        await transaction.memorialStripeEvent.count({
          where: {
            memorialId: id,
            state: "REVIEW_REQUIRED",
            eventType: "checkout.session.completed",
          },
        });

      if (
        paymentRequiresReviewBeforeDeletion(
          existing,
          paymentConflictCount > 0
        )
      ) {
        return { kind: "payment-protected" };
      }

      const activeAttempt =
        await transaction.petMemorialCheckoutAttempt.findUnique({
          where: { activeMemorialId: id },
          select: { id: true, stripeSessionId: true },
        });
      const now = new Date();

      if (activeAttempt) {
        await transaction.petMemorialCheckoutAttempt.updateMany({
          where: {
            id: activeAttempt.id,
            activeMemorialId: id,
            state: { in: ["CREATING", "OPEN"] },
          },
          data: {
            state: "INVALIDATED",
            activeMemorialId: null,
            invalidatedAt: now,
          },
        });
      }

      const memorial = await transaction.petMemorial.update({
        where: { id },
        data: {
          deletedAt: now,
          draftCapabilityInvalidatedAt: now,
        },
        select: { id: true, deletedAt: true },
      });

      return {
        kind: "deleted",
        memorial,
        stripeSessionId:
          activeAttempt?.stripeSessionId || existing.stripeSessionId || null,
      };
    },
    { isolationLevel: "Serializable" }
  );
}

export async function DELETE(_request, context) {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  const { params } = await context;
  const id = params?.id;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Invalid memorial ID." },
      { status: 400 }
    );
  }

  try {
    let result;

    for (
      let transactionAttempt = 1;
      transactionAttempt <= MAX_DELETE_TRANSACTION_ATTEMPTS;
      transactionAttempt += 1
    ) {
      try {
        result = await deleteMemorialTransaction(id);
        break;
      } catch (error) {
        if (
          error?.code !== "P2034" ||
          transactionAttempt === MAX_DELETE_TRANSACTION_ATTEMPTS
        ) {
          throw error;
        }
      }
    }

    if (result.kind === "not-found") {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (result.kind === "payment-protected") {
      return NextResponse.json(
        {
          error: PAYMENT_DELETE_ERROR,
          code: "MEMORIAL_PAYMENT_REVIEW_REQUIRED",
        },
        { status: 409 }
      );
    }

    await bestEffortExpireMemorialCheckoutSession(result.stripeSessionId);

    return NextResponse.json({
      success: true,
      memorial: result.memorial,
    });
  } catch (error) {
    if (error?.code === "P2034") {
      try {
        const [current, paymentConflictCount] = await Promise.all([
          prisma.petMemorial.findUnique({
            where: { id },
            select: {
              status: true,
              paidAt: true,
            },
          }),
          prisma.memorialStripeEvent.count({
            where: {
              memorialId: id,
              state: "REVIEW_REQUIRED",
              eventType: "checkout.session.completed",
            },
          }),
        ]);

        if (
          current &&
          paymentRequiresReviewBeforeDeletion(
            current,
            paymentConflictCount > 0
          )
        ) {
          return NextResponse.json(
            {
              error: PAYMENT_DELETE_ERROR,
              code: "MEMORIAL_PAYMENT_REVIEW_REQUIRED",
            },
            { status: 409 }
          );
        }
      } catch {
        // Fall through to the existing safe generic response.
      }
    }

    console.error("[DELETE_MEMORIAL_ERROR]", {
      id,
      error,
    });

    return NextResponse.json(
      { error: "Failed to delete memorial." },
      { status: 500 }
    );
  }
}
