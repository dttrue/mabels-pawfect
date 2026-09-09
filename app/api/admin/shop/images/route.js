// app/api/admin/shop/images/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import {
  AdminUploadError,
  consumeAdminUploadGrant,
  markAdminUploadPersisted,
  readSmallJson,
  verifyAdminUploadProof,
} from "@/lib/adminCloudinaryUpload";

export const runtime = "nodejs";

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
  const admin = await requireAdmin();
  if (!admin.authorized) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  let asset;
  try {
    const body = await readSmallJson(req);
    const productId = String(body?.productId || "").trim() || null;
    const alt = String(body?.alt || "").trim();
    const caption = String(body?.caption || "").trim() || null;
    const keywords = Array.isArray(body?.keywords) ? body.keywords : [];

    const finalKeywords = keywords
      .map((keyword) => String(keyword).trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10);

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

    asset = await verifyAdminUploadProof(body?.uploadProof, "shop-image");

    const image = await prisma.$transaction(async (transaction) => {
      await consumeAdminUploadGrant(transaction, asset);
      return transaction.productImage.create({
        data: {
          url: asset.secureUrl,
          publicId: asset.publicId,
          alt: alt || null,
          caption,
          keywords: { set: finalKeywords },
          productId: product ? product.id : null,
        },
      });
    });

    await markAdminUploadPersisted(asset.publicId, asset.resourceType);
    return NextResponse.json({ image }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminUploadError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }

    console.error("Product image upload failed");
    return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
  }
}
