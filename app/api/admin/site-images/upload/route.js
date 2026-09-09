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
    const key = String(body?.key || "").trim();
    const alt = String(body?.alt || "").trim();
    const caption = String(body?.caption || "").trim() || null;
    const keywords = Array.isArray(body?.keywords)
      ? body.keywords
          .map((word) => String(word).trim())
          .filter(Boolean)
          .slice(0, 10)
      : [];

    if (!key || !alt) {
      return NextResponse.json(
        { error: "key and alt text required" },
        { status: 400 }
      );
    }

    if (alt.length > 125) {
      return NextResponse.json(
        { error: "Alt text must be 125 characters or fewer" },
        { status: 400 }
      );
    }

    asset = await verifyAdminUploadProof(body?.uploadProof, "site-image");

    const image = await prisma.$transaction(async (transaction) => {
      await consumeAdminUploadGrant(transaction, asset);
      return transaction.siteImage.upsert({
        where: { key },
        create: {
          key,
          imageUrl: asset.secureUrl,
          publicId: asset.publicId,
          alt,
          caption,
          keywords,
        },
        update: {
          imageUrl: asset.secureUrl,
          publicId: asset.publicId,
          alt,
          caption,
          keywords,
        },
      });
    });

    await markAdminUploadPersisted(asset.publicId, asset.resourceType);
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Site image upload failed");
    return NextResponse.json(
      { error: "Failed to save site image" },
      { status: 500 }
    );
  }
}
