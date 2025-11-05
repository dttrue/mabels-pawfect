// app/api/admin/shop/images/[id]/undo/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const UNDO_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(_req, { params }) {
  const { id } = params || {};
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const image = await prisma.productImage.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (!image.deletedAt) {
      return NextResponse.json({ error: "not_deleted" }, { status: 409 });
    }

    const deletedAt = new Date(image.deletedAt).getTime();
    const now = Date.now();

    if (now - deletedAt > UNDO_WINDOW_MS) {
      return NextResponse.json(
        { error: "undo_window_expired" },
        { status: 410 }
      );
    }

    await prisma.productImage.update({
      where: { id },
      data: { deletedAt: null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("🛑 UNDO productImage error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
