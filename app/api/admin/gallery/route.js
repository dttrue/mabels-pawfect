// app/api/admin/gallery/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  AdminUploadError,
  consumeAdminUploadGrant,
  markAdminUploadPersisted,
  readSmallJson,
  verifyAdminUploadProof,
} from "@/lib/adminCloudinaryUpload";

export const runtime = "nodejs";

// GET: Fetch all images (no user filter needed anymore)
export async function GET() {
  try {
    const images = await prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(images);
  } catch (err) {
    console.error("🛑 Gallery fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Upload new image (no provider needed)
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
    const caption = String(body?.caption || "").trim() || null;
    const altText = String(body?.altText || "").trim() || null;
    const category = String(body?.category || "HAPPY").toUpperCase();
    const keywordsRaw = String(body?.keywords || "");

    asset = await verifyAdminUploadProof(body?.uploadProof, "gallery-image");

    // ✅ Sanitize keywords string (comma-separated, lowercase, trimmed)
    const keywords = keywordsRaw
      ? keywordsRaw
          .split(",")
          .map((kw) => kw.trim().toLowerCase())
          .filter((kw) => kw.length > 0)
          .slice(0, 10) // max 10
      : [];

    const newImage = await prisma.$transaction(async (transaction) => {
      await consumeAdminUploadGrant(transaction, asset);
      return transaction.gallery.create({
        data: {
          imageUrl: asset.secureUrl,
          publicId: asset.publicId,
          caption: caption || null,
          altText: altText || null,
          category: category || "HAPPY",
          keywords,
        },
      });
    });

    await markAdminUploadPersisted(asset.publicId, asset.resourceType);
    return NextResponse.json(newImage);
  } catch (error) {
    if (error instanceof AdminUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Gallery upload failed");
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
