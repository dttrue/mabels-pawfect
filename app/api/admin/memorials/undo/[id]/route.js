export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { bestEffortExpireMemorialCheckoutSession } from "@/lib/memorialCheckout";

const UNDO_WINDOW_MS = 15 * 60 * 1000;

export async function POST(_request, context) {
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

  const memorial = await prisma.petMemorial.findUnique({
    where: { id },
    select: {
      id: true,
      deletedAt: true,
      stripeSessionId: true,
    },
  });

  if (!memorial) {
    return NextResponse.json({ error: "Memorial not found." }, { status: 404 });
  }

  if (!memorial.deletedAt) {
    return NextResponse.json(
      { error: "Memorial is not deleted." },
      { status: 409 }
    );
  }

  const elapsed = Date.now() - new Date(memorial.deletedAt).getTime();

  if (elapsed > UNDO_WINDOW_MS) {
    return NextResponse.json(
      { error: "The undo period has expired." },
      { status: 410 }
    );
  }

  const result = await prisma.$transaction(
    async (transaction) => {
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

      const restored = await transaction.petMemorial.update({
        where: { id },
        data: {
          deletedAt: null,
          draftCapabilityInvalidatedAt:
            memorial.deletedAt || memorial.draftCapabilityInvalidatedAt || now,
        },
      });

      return {
        restored,
        stripeSessionId:
          activeAttempt?.stripeSessionId || memorial.stripeSessionId || null,
      };
    },
    { isolationLevel: "Serializable" }
  );

  await bestEffortExpireMemorialCheckoutSession(result.stripeSessionId);

  return NextResponse.json({
    success: true,
    restored: result.restored,
  });
}
