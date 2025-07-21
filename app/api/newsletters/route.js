// app/api/newsletters/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🚀 POST /api/newsletters → Upload a new newsletter
export async function POST(req) {
  try {
    const body = await req.json();
    const { title, description, imageUrl, fileUrl, isActive = true } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: "Missing title or image URL" },
        { status: 400 }
      );
    }

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

    const newNewsletter = await prisma.newsletter.create({
      data: { title, description, imageUrl, fileUrl, isActive },
    });

    return NextResponse.json(newNewsletter);
  } catch (err) {
    console.error("Newsletter creation failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ GET /api/newsletters → Fetch the 4 most recent active newsletters
export async function GET() {
  try {
    const newsletters = await prisma.newsletter.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    return NextResponse.json(newsletters);
  } catch (err) {
    console.error("Failed to fetch newsletters:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

