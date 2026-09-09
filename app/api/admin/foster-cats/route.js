// app/api/admin/foster-cats/route.js

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

const ALLOWED_STATUSES = new Set(["ACTIVE", "FUNDED", "ADOPTED", "ARCHIVED"]);

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

  if (typeof value === "boolean") {
    return value;
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
  const unauthorized = await authorizeAdmin();

  if (unauthorized) {
    return unauthorized;
  }
  let asset;
  try {
    const body = await readSmallJson(req);
    const name = String(body?.name || "").trim();
    const requestedSlug = String(body?.slug || "").trim();
    const shortBio = String(body?.shortBio || "").trim();
    const story = optionalText(body?.story);
    const careNeeds = optionalText(body?.careNeeds);
    const ageLabel = optionalText(body?.ageLabel);
    const sex = optionalText(body?.sex);
    const imageAlt = optionalText(body?.imageAlt);

    const status = String(body?.status || "ACTIVE").toUpperCase();
    const isFeatured = parseBoolean(body?.isFeatured, true);
    const sortOrder = parseInteger(body?.sortOrder, 0);
    const goalCentsRaw = body?.goalCents;

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

    asset = await verifyAdminUploadProof(
      body?.uploadProof,
      "foster-cat-image"
    );

    const fosterCat = await prisma.$transaction(async (transaction) => {
      await consumeAdminUploadGrant(transaction, asset);
      return transaction.fosterCat.create({
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

          imageUrl: asset.secureUrl,
          imagePublicId: asset.publicId,
          imageAssetId: asset.assetId,
          imageWidth: asset.width,
          imageHeight: asset.height,
          imageFormat: asset.format,
          imageBytes: asset.bytes,
          imageAlt: imageAlt || `${name}, a foster cat receiving rescue care`,
        },
      });
    });

    await markAdminUploadPersisted(asset.publicId, asset.resourceType);
    return NextResponse.json({ cat: fosterCat }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("[admin foster cats] POST failed");
    return NextResponse.json(
      { error: "Failed to create foster cat" },
      { status: 500 }
    );
  }
}
