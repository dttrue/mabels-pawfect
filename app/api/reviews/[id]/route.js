import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/adminAuth";

const prisma = new PrismaClient();
export async function DELETE(req, context) {
  try {
    const admin = await requireAdmin();
    if (!admin.authorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
      );
    }

    const { id } = await context.params;
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ message: "Review deleted" }, {
      status: 200,
    });
  } catch {
    console.error("Review DELETE failed");
    return NextResponse.json({ error: "Failed to delete review" }, {
      status: 500,
    });
  }
}


export async function PUT(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin.authorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, message, imageUrl, rating } = body;

    const updated = await prisma.review.update({
      where: { id },
      data: { name, message, imageUrl, rating },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
