// app/api/admin/shop/upload/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.authorized) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  return NextResponse.json(
    { error: "Use the verified shop-image upload endpoint" },
    { status: 410 }
  );
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
