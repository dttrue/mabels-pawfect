// app/api/admin/newsletters/route.js
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

function unauthorizedResponse(admin) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
  );
}

// 🆕 POST - Add Newsletter
export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin.authorized) return unauthorizedResponse(admin);

  let imageAsset;
  let pdfAsset;
  try {
    const {
      title,
      description,
      isActive = true,
      altText,
      keywords, // expect this to be an array (["cat safety", "spring tips"])
      imageUploadProof,
      pdfUploadProof,
    } = await readSmallJson(req);

    if (!title || !imageUploadProof) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    imageAsset = await verifyAdminUploadProof(
      imageUploadProof,
      "newsletter-image"
    );
    if (pdfUploadProof) {
      pdfAsset = await verifyAdminUploadProof(
        pdfUploadProof,
        "newsletter-pdf"
      );
    }

    const created = await prisma.$transaction(async (transaction) => {
      await consumeAdminUploadGrant(transaction, imageAsset);
      if (pdfAsset) {
        await consumeAdminUploadGrant(transaction, pdfAsset);
      }

      return transaction.newsletter.create({
        data: {
          title,
          description,
          imageUrl: imageAsset.secureUrl,
          fileUrl: pdfAsset?.secureUrl || null,
          isActive,
          altText,
          publicId: imageAsset.publicId,
          keywords: Array.isArray(keywords)
            ? keywords
            : typeof keywords === "string"
              ? keywords.split(",").map((kw) => kw.trim())
              : [],
        },
      });
    });

    await Promise.all([
      markAdminUploadPersisted(imageAsset.publicId, imageAsset.resourceType),
      pdfAsset
        ? markAdminUploadPersisted(pdfAsset.publicId, pdfAsset.resourceType)
        : Promise.resolve(),
    ]);
    return NextResponse.json(created);
  } catch (error) {
    if (error instanceof AdminUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Newsletter creation failed");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


// ❌ DELETE - Remove Newsletter by ID
export async function DELETE(req) {
  const admin = await requireAdmin();
  if (!admin.authorized) return unauthorizedResponse(admin);

  try {
    const { id } = await readSmallJson(req, 4 * 1024);
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await prisma.newsletter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Newsletter deletion failed");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
