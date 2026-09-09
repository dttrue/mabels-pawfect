// app/api/admin/shop/products/[id]/undo/route.js

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";

function unauthorizedResponse(admin) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
  );
}

export async function POST(_req, context) {
  const admin = await requireAdmin();
  if (!admin.authorized) return unauthorizedResponse(admin);

  const params = await context.params;
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
