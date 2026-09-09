// app/api/admin/highlights/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import {
  AdminUploadError,
  adminCloudinaryUrl,
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
    const {
      title,
      slug,
      startSec,
      type = "video",
      uploadProof,
    } = await readSmallJson(req);
    if (!title || !slug || !uploadProof) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    asset = await verifyAdminUploadProof(uploadProof, "highlight-video");
    const url = adminCloudinaryUrl(asset.publicId, {
      resource_type: "video",
      format: "mp4",
      transformation: [{ quality: "auto:good", video_codec: "h264:main" }],
    });
    const posterUrl = adminCloudinaryUrl(asset.publicId, {
      resource_type: "video",
      format: "jpg",
      transformation: [{ start_offset: 2 }],
    });

    const row = await prisma.$transaction(async (transaction) => {
      await consumeAdminUploadGrant(transaction, asset);
      return transaction.highlight.upsert({
        where: { slug },
        update: {
          title,
          publicId: asset.publicId,
          url,
          posterUrl,
          startSec,
          type,
        },
        create: {
          title,
          slug,
          publicId: asset.publicId,
          url,
          posterUrl,
          startSec,
          type,
        },
      });
    });

    await markAdminUploadPersisted(asset.publicId, asset.resourceType);
    return NextResponse.json({ highlight: row }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Highlight save failed");
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const includeDeleted = url.searchParams.get("includeDeleted") === "1";

  const rows = await prisma.highlight.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      url: true,
      posterUrl: true,
      type: true,
      publicId: true,
      deletedAt: true,
    },
  });

  return NextResponse.json({ highlights: rows });
}
