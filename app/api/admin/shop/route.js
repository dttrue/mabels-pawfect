// app/api/shop/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          orderBy: { sort: "asc" },
          select: {
            id: true,
            publicId: true,
            url: true,
            alt: true,
            caption: true,
          },
        },
      },
    });

    // Add friendly display price if not computed in DB
    const withDisplay = products.map((p) => ({
      ...p,
      _price: `$${(p.priceCents / 100).toFixed(2)}`,
    }));

    return NextResponse.json(withDisplay);
  } catch (err) {
    console.error("Error fetching products:", err);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}
