// app/api/admin/inventory/adjust/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST JSON: { productId, variantId, delta, reason?, userId? }
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      productId,
      variantId,
      delta,
      reason,
      userId,
      source = "admin_ui",
    } = body || {};

    if (!productId || !variantId || typeof delta !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const row = await prisma.$transaction(async (tx) => {
      // 1) Ensure the inventory row exists WITHOUT using upsert (avoid P2002 races)
      let inv = await tx.inventory.findUnique({
        where: { productId_variantId: { productId, variantId } },
        select: { onHand: true },
      });

      if (!inv) {
        try {
          await tx.inventory.create({
            data: { productId, variantId, onHand: 0 },
          });
          inv = { onHand: 0 };
        } catch (e) {
          // another request created it at the same time; fetch again
          inv = await tx.inventory.findUnique({
            where: { productId_variantId: { productId, variantId } },
            select: { onHand: true },
          });
          if (!inv) throw e; // rethrow if truly missing
        }
      }

      const fromQty = inv.onHand;
      const toQty = fromQty + delta;
      if (toQty < 0) throw new Error("Cannot reduce below 0");

      const updated = await tx.inventory.update({
        where: { productId_variantId: { productId, variantId } },
        data: { onHand: toQty },
      });

      await tx.inventoryLog.create({
        data: {
          productId,
          variantId,
          userId: userId ?? null,
          action: "ADJUST",
          delta,
          fromQty,
          toQty,
          reason: reason ?? null,
          source,
        },
      });

      return updated;
    });

    return NextResponse.json({ ok: true, row });
  } catch (err) {
    console.error("[inventory/adjust] POST error:", err);
    return NextResponse.json(
      { error: "Failed to adjust inventory" },
      { status: 500 }
    );
  }
}
