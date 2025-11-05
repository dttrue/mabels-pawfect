// app/api/admin/shop/images/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(_req, { params }) {
  const { id } = params || {};
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    // Check if it exists first
    const image = await prisma.productImage.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (image.deletedAt) {
      return NextResponse.json({ error: "already_deleted" }, { status: 409 });
    }

    // Soft delete by setting deletedAt timestamp
    await prisma.productImage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("🛑 DELETE productImage error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
