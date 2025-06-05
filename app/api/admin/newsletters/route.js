// app/api/admin/newsletters/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🆕 POST - Add Newsletter
export async function POST(req) {
  try {
    const {
      title,
      description,
      imageUrl,
      fileUrl,
      isActive = true,
    } = await req.json();

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const created = await prisma.newsletter.create({
      data: { title, description, imageUrl, fileUrl, isActive },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error("POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ❌ DELETE - Remove Newsletter by ID
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await prisma.newsletter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
