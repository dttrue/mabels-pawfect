import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function DELETE(req, context) {
  const { id } = context.params;

  try {
    await prisma.review.delete({ where: { id } });
    return new Response(JSON.stringify({ message: "Review deleted" }), {
      status: 200,
    });
  } catch (err) {
    console.error("Delete failed:", err);
    return new Response(JSON.stringify({ error: "Failed to delete review" }), {
      status: 500,
    });
  }
}


export async function PUT(req, { params }) {
  const { id } = params;
  const body = await req.json();
  const { name, message, imageUrl, rating } = body;

  try {
    const updated = await prisma.review.update({
      where: { id },
      data: { name, message, imageUrl, rating },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
