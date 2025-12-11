// app/api/admin/site-images/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    if (key) {
      const image = await prisma.siteImage.findUnique({ where: { key } });
      return NextResponse.json({ image: image || null });
    }

    // 🔥 list all site images for the admin list
    const images = await prisma.siteImage.findMany({
      orderBy: [{ key: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ images });
  } catch (err) {
    console.error("SiteImage GET error:", err);
    return NextResponse.json(
      { error: "Failed to load site images" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { key, imageUrl, publicId, alt, caption, keywords = [] } = body;

    if (!key || !imageUrl || !publicId) {
      return NextResponse.json(
        { error: "key, imageUrl, publicId required" },
        { status: 400 }
      );
    }

    const image = await prisma.siteImage.upsert({
      where: { key },
      create: {
        key,
        imageUrl,
        publicId,
        alt: alt?.trim() || null,
        caption: caption?.trim() || null,
        keywords,
      },
      update: {
        imageUrl,
        publicId,
        alt: alt?.trim() || null,
        caption: caption?.trim() || null,
        keywords,
      },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (err) {
    console.error("SiteImage POST error:", err);
    return NextResponse.json(
      { error: "Failed to save site image" },
      { status: 500 }
    );
  }
}
