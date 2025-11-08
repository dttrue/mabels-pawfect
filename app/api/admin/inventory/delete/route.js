import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST JSON: { productId: string, variantId: string, reason?: string, userId?: string }
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      productId,
      variantId,
      reason,
      userId,
      source = "admin_ui",
    } = body || {};
    if (!productId || !variantId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const res = await prisma.$transaction(async (tx) => {
      const prev = await tx.inventory.findUnique({
        where: { productId_variantId: { productId, variantId } },
        select: { onHand: true },
      });

      if (!prev) return { deleted: false };

      await tx.inventory.delete({
        where: { productId_variantId: { productId, variantId } },
      });

      await tx.inventoryLog.create({
        data: {
          productId,
          variantId,
          userId: userId ?? null,
          action: "DELETE",
          delta: -prev.onHand,
          fromQty: prev.onHand,
          toQty: 0,
          reason: reason ?? null,
          source,
        },
      });

      return { deleted: true };
    });

    return NextResponse.json({ ok: true, ...res });
  } catch (err) {
    console.error("[inventory/delete] POST error:", err);
    return NextResponse.json(
      { error: "Failed to delete inventory row" },
      { status: 500 }
    );
  }
}
