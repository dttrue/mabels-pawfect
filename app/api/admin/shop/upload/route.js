// app/api/admin/shop/upload/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    imageUrl,
    publicId,
    altText = "",
    caption = "",
    productId,
  } = body || {};
  if (!imageUrl || !publicId) {
    return NextResponse.json(
      { error: "imageUrl and publicId required" },
      { status: 400 }
    );
  }

  try {
    const image = await prisma.productImage.create({
      data: {
        url: imageUrl,
        publicId, // <- for <CldImage src={publicId}>
        alt: altText,
        caption, // optional
        sort: 0,
        productId: productId || null, // optional link to a product
      },
      select: {
        id: true,
        url: true,
        publicId: true,
        alt: true,
        caption: true,
        productId: true,
      },
    });

    return NextResponse.json({ ok: true, image });
  } catch (err) {
    console.error("Shop upload route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const rows = await prisma.productImage.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      url: true,
      publicId: true,
      productId: true,
      createdAt: true,
    },
  });
  return NextResponse.json(rows);
}
