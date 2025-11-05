// app/api/admin/shop/products/[id]/undo/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(_req, { params }) {
  const { id } = params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });
  if (!product || !product.deletedAt) {
    return NextResponse.json({ error: "Nothing to undo" }, { status: 404 });
  }

  const deletedTime = new Date(product.deletedAt).getTime();
  if (Date.now() - deletedTime > 15 * 60 * 1000) {
    return NextResponse.json({ error: "Undo period expired" }, { status: 403 });
  }

  const restored = await prisma.product.update({
    where: { id },
    data: { deletedAt: null },
    select: { id: true, title: true, priceCents: true, deletedAt: true },
  });

  return NextResponse.json({ product: restored, message: "Product restored" });
}
