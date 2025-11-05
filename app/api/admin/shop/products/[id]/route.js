import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ DELETE /api/admin/shop/products/[id]
// Soft-deletes the product by setting deletedAt
export async function DELETE(_req, { params }) {
  try {
    const found = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true, deletedAt: true },
    });
    if (!found)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (found.deletedAt) {
      return NextResponse.json({ message: "Already deleted" }); // idempotent
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
      select: { id: true, title: true, deletedAt: true },
    });
    return NextResponse.json({ product, message: "Product deleted" });
  } catch (e) {
    console.error("❌ Product delete failed:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}


// ✅ POST /api/admin/shop/products/[id]/undo
// Restores a recently deleted product (within 15 minutes)
export async function POST(_req, { params }) {
  const { id } = params;

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || !product.deletedAt) {
      return NextResponse.json({ error: "Nothing to undo" }, { status: 404 });
    }

    const deletedTime = new Date(product.deletedAt).getTime();
    const now = Date.now();
    if (now - deletedTime > 15 * 60 * 1000) {
      return NextResponse.json(
        { error: "Undo period expired" },
        { status: 403 }
      );
    }

    const restored = await prisma.product.update({
      where: { id },
      data: { deletedAt: null },
    });

    return NextResponse.json({
      product: restored,
      message: "Product restored",
    });
  } catch (e) {
    console.error("❌ Undo failed:", e);
    return NextResponse.json({ error: "Undo failed" }, { status: 400 });
  }
}

// ✅ PATCH /api/admin/shop/products/[id]
// Updates the price of a product
export async function PATCH(req, { params }) {
  try {
    const { priceDollars } = await req.json();
    if (priceDollars == null) {
      return NextResponse.json(
        { error: "priceDollars required" },
        { status: 400 }
      );
    }
    const priceCents = Math.round(Number(priceDollars) * 100);
    if (
      !Number.isFinite(priceCents) ||
      priceCents < 0 ||
      priceCents > 1_000_000_00
    ) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: { priceCents },
      select: { id: true, title: true, priceCents: true },
    });

    return NextResponse.json({ product });
  } catch (e) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
