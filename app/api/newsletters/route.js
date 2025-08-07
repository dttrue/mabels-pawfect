// app/api/newsletters/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🚀 POST /api/newsletters
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      imageUrl,
      fileUrl,
      isActive = true,
      altText,
      publicId,
      keywords,
    } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: "Missing title or image URL" },
        { status: 400 }
      );
    }

    // Keep max of 8 active newsletters
    const activeCount = await prisma.newsletter.count({
      where: { isActive: true },
    });

    if (activeCount >= 8) {
      const oldest = await prisma.newsletter.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });

      if (oldest) {
        await prisma.newsletter.update({
          where: { id: oldest.id },
          data: { isActive: false },
        });
      }
    }

    const created = await prisma.newsletter.create({
      data: {
        title,
        description,
        imageUrl,
        fileUrl,
        isActive,
        altText,
        publicId,
        keywords: Array.isArray(keywords)
          ? keywords
          : typeof keywords === "string"
            ? keywords.split(",").map((kw) => kw.trim())
            : [],
      },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error("Newsletter creation failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ GET /api/newsletters → For homepage carousel
export async function GET() {
  try {
    const newsletters = await prisma.newsletter.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 3, // 🔧 Show only 3 in carousel
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        altText: true,
        fileUrl: true,
        createdAt: true,
        keywords: true,
      },
    });

    return NextResponse.json(newsletters);
  } catch (err) {
    console.error("Failed to fetch newsletters:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


