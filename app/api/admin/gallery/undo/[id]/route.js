// app/api/admin/gallery/undo/[id]/route.js

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

export async function POST(_req, context) {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  const { id } = await context.params;

  const restored = await prisma.gallery.update({
    where: { id },
    data: { deletedAt: null },
  });

  return NextResponse.json({ success: true, restored });
}
