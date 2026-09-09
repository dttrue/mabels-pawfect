export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

function attemptStateAtPayment(result) {
  if (result === "LATE_PAYMENT_EXPIRED_ATTEMPT") {
    return "EXPIRED";
  }

  if (result === "LATE_PAYMENT_INVALIDATED_ATTEMPT") {
    return "INVALIDATED";
  }

  if (result === "LATE_PAYMENT_SUPERSEDED_ATTEMPT") {
    return "SUPERSEDED";
  }

  return null;
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  try {
    const events = await prisma.memorialStripeEvent.findMany({
      where: {
        state: "REVIEW_REQUIRED",
        eventType: "checkout.session.completed",
      },
      orderBy: [{ stripeCreatedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        stripeEventId: true,
        stripeSessionId: true,
        stripeCreatedAt: true,
        createdAt: true,
        result: true,
        memorialId: true,
        checkoutAttempt: {
          select: {
            id: true,
            state: true,
            amountCents: true,
            currency: true,
          },
        },
      },
    });
    const memorialIds = [
      ...new Set(events.map(({ memorialId }) => memorialId).filter(Boolean)),
    ];
    const memorials = memorialIds.length
      ? await prisma.petMemorial.findMany({
          where: { id: { in: memorialIds } },
          select: {
            id: true,
            petName: true,
            status: true,
            deletedAt: true,
            donationAmountCents: true,
            currency: true,
          },
        })
      : [];
    const memorialById = new Map(
      memorials.map((memorial) => [memorial.id, memorial])
    );
    const conflicts = events.map((event) => {
      const memorial = event.memorialId
        ? memorialById.get(event.memorialId) || null
        : null;

      return {
        id: event.id,
        reviewReason: event.result || "PAYMENT_REVIEW_REQUIRED",
        eventTime: event.stripeCreatedAt || event.createdAt,
        stripeEventId: event.stripeEventId,
        stripeSessionId: event.stripeSessionId,
        amountCents:
          event.checkoutAttempt?.amountCents ??
          memorial?.donationAmountCents ??
          null,
        currency:
          event.checkoutAttempt?.currency || memorial?.currency || null,
        checkoutAttempt: event.checkoutAttempt
          ? {
              id: event.checkoutAttempt.id,
              state: event.checkoutAttempt.state,
              stateAtPayment: attemptStateAtPayment(event.result),
            }
          : null,
        memorial: {
          id: event.memorialId,
          petName: memorial?.petName || null,
          status: memorial?.status || "NOT_FOUND",
          deletedAt: memorial?.deletedAt || null,
        },
      };
    });

    return NextResponse.json(
      { conflicts },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    console.error("[ADMIN_MEMORIAL_PAYMENT_CONFLICTS_GET_ERROR]");

    return NextResponse.json(
      { error: "Failed to load memorial payment conflicts." },
      { status: 500 }
    );
  }
}
