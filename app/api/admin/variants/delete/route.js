// app/api/admin/variants/delete/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { productId, variantId, reason } = await req.json();
    if (!productId || !variantId) {
      return NextResponse.json(
        { error: "productId and variantId required" },
        { status: 400 }
      );
    }

    // Optional sanity: ensure variant belongs to product
    const v = await prisma.variant.findUnique({
      where: { id: variantId },
      select: { productId: true, name: true },
    });
    if (!v || v.productId !== productId) {
      return NextResponse.json(
        { error: "Variant not found for product" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1) Clear cart items holding this variant
      await tx.cartItem.deleteMany({ where: { productId, variantId } });

      // 2) Remove inventory rows for this variant
      await tx.inventory.deleteMany({ where: { productId, variantId } });

      // 3) Keep audit trail but break FK (schema uses onDelete: SetNull, this is extra safety)
      await tx.inventoryLog.updateMany({
        where: { productId, variantId },
        data: { variantId: null, reason: reason ?? "variant deleted" },
      });

      // 4) Finally delete variant
      await tx.variant.delete({ where: { id: variantId } });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("delete variant failed:", e);
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
