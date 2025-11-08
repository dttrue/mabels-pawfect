import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST JSON: { productId: string, variantId: string, onHand: number, reason?: string, userId?: string }
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      productId,
      variantId,
      onHand,
      reason,
      userId,
      source = "admin_ui",
    } = body || {};

    if (!productId || !variantId || typeof onHand !== "number" || onHand < 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let prev = await tx.inventory.findUnique({
        where: { productId_variantId: { productId, variantId } },
        select: { onHand: true },
      });
      if (!prev) {
        try {
          await tx.inventory.create({
            data: { productId, variantId, onHand: 0 },
          });
        } catch (e) {
          /* swallow P2002 and continue */
        }
        prev = await tx.inventory.findUnique({
          where: { productId_variantId: { productId, variantId } },
          select: { onHand: true },
        });
      }
      const fromQty = prev?.onHand ?? 0;

      const row = await tx.inventory.upsert({
        where: { productId_variantId: { productId, variantId } },
        update: { onHand },
        create: { productId, variantId, onHand },
      });

      await tx.inventoryLog.create({
        data: {
          productId,
          variantId,
          userId: userId ?? null,
          action: "UPSERT",
          delta: onHand - fromQty,
          fromQty,
          toQty: onHand,
          reason: reason ?? null,
          source,
        },
      });

      return row;
    });

    return NextResponse.json({ ok: true, row: result });
  } catch (err) {
    console.error("[inventory/upsert] POST error:", err);
    return NextResponse.json(
      { error: "Failed to upsert inventory" },
      { status: 500 }
    );
  }
}
