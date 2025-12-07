import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function DELETE(_req, { params }) {
  const { userId } = auth();

  // 🔓 allow unauthenticated access in dev, require Clerk in prod
  if (!userId && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await params.id;
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

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
