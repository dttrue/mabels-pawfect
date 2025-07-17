// app/api/admin/gallery/upload/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { imageUrl, publicId, altText, caption, category } = body;

    if (!imageUrl || !publicId || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const entry = await prisma.gallery.create({
      data: {
        imageUrl,
        publicId,
        altText,
        caption,
        category,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("🛑 Upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

