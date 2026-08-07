// app/api/admin/foster-cats/[id]/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function DELETE(_req, { params }) {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Foster cat ID is required" },
      { status: 400 }
    );
  }

  try {
    const fosterCat = await prisma.fosterCat.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!fosterCat) {
      return NextResponse.json(
        { error: "Foster cat not found" },
        { status: 404 }
      );
    }

    await prisma.fosterCat.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        isFeatured: false,
        status: "ARCHIVED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `${fosterCat.name} was removed.`,
    });
  } catch (error) {
    console.error("[admin foster cats] DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to remove foster cat" },
      { status: 500 }
    );
  }
}
