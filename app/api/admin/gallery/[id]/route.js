// app/api/admin/gallery/[id]/route.js

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function DELETE(_req, context) {
  // Next.js 15+ requires awaiting params
  const { params } = await context;
  const id = params.id;

  if (!id || typeof id !== "string") {
    console.error("❌ Invalid gallery id param:", params);
    return NextResponse.json({ error: "Invalid gallery id" }, { status: 400 });
  }

  try {
    const image = await prisma.gallery.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, image });
  } catch (err) {
    console.error("❌ DELETE_IMAGE_ERROR:", { id, err });

    // Prisma: record not found
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
