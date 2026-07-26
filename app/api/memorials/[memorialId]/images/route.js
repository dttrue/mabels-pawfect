// app/api/memorials/[memorialId]/images/route.js

import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function sanitizeFileName(fileName) {
  return String(fileName || "memorial-image")
    .trim()
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(request, context) {
  try {
    const { memorialId } = await context.params;

    if (!memorialId) {
      return NextResponse.json(
        {
          error: "Missing memorial ID.",
        },
        {
          status: 400,
        }
      );
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;

    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error(
        "[memorial-images] Missing Cloudinary environment variables.",
        {
          hasCloudName: Boolean(cloudName),
          hasUploadPreset: Boolean(uploadPreset),
        }
      );

      return NextResponse.json(
        {
          error: "Image uploads are not configured correctly.",
        },
        {
          status: 500,
        }
      );
    }

    const memorial = await prisma.petMemorial.findUnique({
      where: {
        id: memorialId,
      },
      include: {
        images: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!memorial || memorial.deletedAt) {
      return NextResponse.json(
        {
          error: "Memorial submission not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (!["DRAFT", "PENDING_PAYMENT"].includes(memorial.status)) {
      return NextResponse.json(
        {
          error: "Images can no longer be added to this memorial.",
        },
        {
          status: 409,
        }
      );
    }

    const existingImageCount = memorial.images.length;

    if (existingImageCount >= MAX_IMAGES) {
      return NextResponse.json(
        {
          error: `You can upload up to ${MAX_IMAGES} photos.`,
        },
        {
          status: 400,
        }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");

    const altText = String(formData.get("altText") || "").trim();

    const caption = String(formData.get("caption") || "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Please select an image.",
        },
        {
          status: 400,
        }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: "Only JPEG, PNG, WebP, HEIC, and HEIF images are allowed.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "Each image must be smaller than 10 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const safeName = sanitizeFileName(file.name) || "memorial-image";

    const publicId = `${Date.now()}-${randomUUID()}-${safeName}`;

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: new URLSearchParams({
          file: `data:${file.type};base64,${buffer.toString("base64")}`,
          upload_preset: uploadPreset,
          public_id: publicId,
          folder: `mabels-pawfect/memorials/${memorialId}`,
        }),
      }
    );

    const cloudinaryData = await cloudinaryResponse.json().catch(() => null);

    if (
      !cloudinaryResponse.ok ||
      !cloudinaryData?.secure_url ||
      !cloudinaryData?.public_id
    ) {
      console.error("[memorial-images] Cloudinary error:", {
        status: cloudinaryResponse.status,
        response: cloudinaryData,
      });

      return NextResponse.json(
        {
          error:
            cloudinaryData?.error?.message ||
            "The image could not be uploaded. Please try again.",
        },
        {
          status: 502,
        }
      );
    }

    const image = await prisma.petMemorialImage.create({
      data: {
        memorialId,

        imageUrl: cloudinaryData.secure_url,
        publicId: cloudinaryData.public_id,
        assetId: cloudinaryData.asset_id || null,

        version:
          typeof cloudinaryData.version === "number"
            ? cloudinaryData.version
            : null,

        format: cloudinaryData.format || null,

        resourceType: cloudinaryData.resource_type || "image",

        width:
          typeof cloudinaryData.width === "number"
            ? cloudinaryData.width
            : null,

        height:
          typeof cloudinaryData.height === "number"
            ? cloudinaryData.height
            : null,

        bytes:
          typeof cloudinaryData.bytes === "number"
            ? cloudinaryData.bytes
            : null,

        altText: altText || null,
        caption: caption || null,

        sortOrder: existingImageCount,
        isCover: existingImageCount === 0,
      },
    });

    return NextResponse.json(
      {
        image,
        imageCount: existingImageCount + 1,
        remainingSlots: MAX_IMAGES - existingImageCount - 1,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("[memorial-images] upload error:", error);

    return NextResponse.json(
      {
        error: "The image could not be uploaded. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}
