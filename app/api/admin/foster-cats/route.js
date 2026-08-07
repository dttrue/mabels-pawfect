// app/api/admin/foster-cats/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

const ALLOWED_STATUSES = new Set(["ACTIVE", "FUNDED", "ADOPTED", "ARCHIVED"]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;

const CLOUDINARY_UPLOAD_PRESET =
  process.env.CLOUDINARY_UPLOAD_PRESET ||
  process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function optionalText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function parseBoolean(value, defaultValue = false) {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  return value === "true" || value === "1" || value === "on";
}

function parseInteger(value, defaultValue = 0) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : defaultValue;
}

async function authorizeAdmin() {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  return null;
}

export async function GET() {
  const unauthorized = await authorizeAdmin();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const fosterCats = await prisma.fosterCat.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      include: {
        donations: {
          where: {
            status: "PAID",
          },
          select: {
            amountCents: true,
          },
        },
      },
    });

    const cats = fosterCats.map(({ donations, ...cat }) => ({
      ...cat,
      raisedCents: donations.reduce(
        (total, donation) => total + donation.amountCents,
        0
      ),
      paidDonationCount: donations.length,
    }));

    return NextResponse.json({ cats });
  } catch (error) {
    console.error("[admin foster cats] GET error:", error);

    return NextResponse.json(
      { error: "Failed to load foster cats" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  console.log("[admin foster cats] POST handler reached");

  const unauthorized = await authorizeAdmin();

  console.log("[admin foster cats] POST authorization:", {
    blocked: Boolean(unauthorized),
  });

  if (unauthorized) {
    return unauthorized;
  }
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const name = String(formData.get("name") || "").trim();
    const requestedSlug = String(formData.get("slug") || "").trim();
    const shortBio = String(formData.get("shortBio") || "").trim();
    const story = optionalText(formData.get("story"));
    const careNeeds = optionalText(formData.get("careNeeds"));
    const ageLabel = optionalText(formData.get("ageLabel"));
    const sex = optionalText(formData.get("sex"));
    const imageAlt = optionalText(formData.get("imageAlt"));

    const status = String(formData.get("status") || "ACTIVE").toUpperCase();

    const isFeatured = parseBoolean(formData.get("isFeatured"), true);

    const sortOrder = parseInteger(formData.get("sortOrder"), 0);

    const goalCentsRaw = formData.get("goalCents");

    const goalCents =
      goalCentsRaw === null || String(goalCentsRaw).trim() === ""
        ? null
        : parseInteger(goalCentsRaw, -1);

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!shortBio) {
      return NextResponse.json(
        { error: "Short bio is required" },
        { status: 400 }
      );
    }

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "An image is required" },
        { status: 400 }
      );
    }

    if (!file.type?.startsWith("image/")) {
      return NextResponse.json(
        { error: "The uploaded file must be an image" },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "The image must be 10 MB or smaller" },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Invalid foster cat status" },
        { status: 400 }
      );
    }

    if (goalCents !== null && goalCents < 0) {
      return NextResponse.json(
        { error: "Fundraising goal must be zero or greater" },
        { status: 400 }
      );
    }

    const slug = slugify(requestedSlug || name);

    if (!slug) {
      return NextResponse.json(
        { error: "Unable to create a valid slug" },
        { status: 400 }
      );
    }

    const existingCat = await prisma.fosterCat.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (existingCat) {
      return NextResponse.json(
        { error: "A foster cat already uses this name or slug" },
        { status: 409 }
      );
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.error("[admin foster cats] Missing Cloudinary configuration", {
        hasCloudName: Boolean(CLOUDINARY_CLOUD_NAME),
        hasUploadPreset: Boolean(CLOUDINARY_UPLOAD_PRESET),
      });

      return NextResponse.json(
        { error: "Cloudinary upload is not configured" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicId = `${Date.now()}-${slug}`;

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: new URLSearchParams({
          file: `data:${file.type};base64,${buffer.toString("base64")}`,
          upload_preset: CLOUDINARY_UPLOAD_PRESET,
          public_id: publicId,
          folder: "mabels-pawfect/foster-cats",
        }),
      }
    );

    const cloudinaryData = await cloudinaryResponse.json().catch(() => ({}));

    if (
      !cloudinaryResponse.ok ||
      !cloudinaryData.secure_url ||
      !cloudinaryData.public_id
    ) {
      console.error("[admin foster cats] Cloudinary error:", {
        status: cloudinaryResponse.status,
        error: cloudinaryData?.error || cloudinaryData,
      });

      return NextResponse.json(
        {
          error:
            cloudinaryData?.error?.message || "Cloudinary image upload failed",
        },
        { status: 502 }
      );
    }

    const fosterCat = await prisma.fosterCat.create({
      data: {
        name,
        slug,
        shortBio,
        story,
        careNeeds,
        ageLabel,
        sex,
        goalCents,
        status,
        isFeatured,
        sortOrder,

        imageUrl: cloudinaryData.secure_url,
        imagePublicId: cloudinaryData.public_id,
        imageAssetId: cloudinaryData.asset_id || null,
        imageWidth: cloudinaryData.width || null,
        imageHeight: cloudinaryData.height || null,
        imageFormat: cloudinaryData.format || null,
        imageBytes: cloudinaryData.bytes || null,
        imageAlt: imageAlt || `${name}, a foster cat receiving rescue care`,
      },
    });

    return NextResponse.json({ cat: fosterCat }, { status: 201 });
  } catch (error) {
    console.error("[admin foster cats] POST error:", error);

    return NextResponse.json(
      { error: "Failed to create foster cat" },
      { status: 500 }
    );
  }
}
