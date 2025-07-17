// app/api/admin/gallery/[id]/route.js

import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const image = await prisma.gallery.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE_IMAGE_ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
