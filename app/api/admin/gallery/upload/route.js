// app/api/admin/gallery/upload/route.js

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
    const altText = String(body?.altText || "").trim() || null;
    const caption = String(body?.caption || "").trim() || null;
    const category = String(body?.category || "HAPPY").toUpperCase();
    const keywords = String(body?.keywords || "")
      .split(",")
      .map((keyword) => keyword.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10);

    if (!new Set(["HAPPY", "MEMORIAM"]).has(category)) {
      return NextResponse.json(
        { error: "Invalid gallery category" },
        { status: 400 }
      );
    }

    asset = await verifyAdminUploadProof(body?.uploadProof, "gallery-image");

    const entry = await prisma.$transaction(async (transaction) => {
      await consumeAdminUploadGrant(transaction, asset);
      return transaction.gallery.create({
        data: {
          imageUrl: asset.secureUrl,
          publicId: asset.publicId,
          altText,
          caption,
          category,
          keywords,
        },
      });
    });

    await markAdminUploadPersisted(asset.publicId, asset.resourceType);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof AdminUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Gallery upload failed");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
