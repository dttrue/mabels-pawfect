// app/api/admin/shop/images/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function GET(req) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  const includeDeleted = url.searchParams.get("includeDeleted") === "1";

  try {
    const images = await prisma.productImage.findMany({
      where: {
        ...(productId ? { productId } : {}),
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: [{ deletedAt: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ images });
  } catch (err) {
    console.error("🛑 GET productImage list error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      url,
      imageUrl,
      publicId,
      alt,
      altText,
      caption,
      keywords,
      productId,
    } = body;

    const finalUrl = url || imageUrl;
    const finalAlt = (alt ?? altText) || null;

    const finalKeywords = Array.isArray(keywords)
      ? keywords
      : String(keywords || "")
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);

    if (!finalUrl || !publicId) {
      return NextResponse.json(
        { error: "Missing url/publicId" },
        { status: 400 }
      );
    }

    let product = null;
    if (productId) {
      product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Invalid productId" },
          { status: 400 }
        );
      }
    }

    const image = await prisma.productImage.create({
      data: {
        url: finalUrl,
        publicId,
        alt: finalAlt,
        caption: caption || null,
        keywords: { set: finalKeywords },
        productId: product ? product.id : null,
      },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (err) {
    if (err?.code === "P2002" && err?.meta?.target?.includes("publicId")) {
      return NextResponse.json(
        { error: "Duplicate publicId" },
        { status: 409 }
      );
    }
    console.error("shop/images POST error", err);
    return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
  }
}
