// app/api/admin/memorials/[id]/publish/route.js

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createUniqueSlug(petName, memorialId) {
  const baseSlug = slugify(petName) || `memorial-${memorialId.slice(-6)}`;

  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.petMemorial.findFirst({
      where: {
        slug: candidate,
        NOT: {
          id: memorialId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function POST(_request, context) {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    const isSignedOut = admin.reason === "SIGNED_OUT";

    return NextResponse.json(
      {
        error: isSignedOut
          ? "Authentication required."
          : "You are not authorized to publish memorials.",
      },
      {
        status: isSignedOut ? 401 : 403,
      }
    );
  }

  const { params } = await context;
  const id = String(params?.id || "").trim();

  if (!id) {
    return NextResponse.json(
      {
        error: "Invalid memorial ID.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const memorial = await prisma.petMemorial.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        petName: true,
        status: true,
        slug: true,
        deletedAt: true,
        images: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!memorial) {
      return NextResponse.json(
        {
          error: "Memorial not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (memorial.deletedAt) {
      return NextResponse.json(
        {
          error: "Deleted memorials cannot be published.",
        },
        {
          status: 409,
        }
      );
    }

    if (memorial.status !== "PAID") {
      return NextResponse.json(
        {
          error: "Only paid memorials can be published.",
        },
        {
          status: 409,
        }
      );
    }

    if (memorial.images.length === 0) {
      return NextResponse.json(
        {
          error:
            "This memorial must have at least one active image before it can be published.",
        },
        {
          status: 409,
        }
      );
    }

    const slug =
      memorial.slug || (await createUniqueSlug(memorial.petName, memorial.id));

    const publishedAt = new Date();

    const updatedMemorial = await prisma.petMemorial.update({
      where: {
        id: memorial.id,
      },
      data: {
        status: "PUBLISHED",
        slug,
        publishedAt,
        reviewedAt: publishedAt,
        reviewedBy: admin.userId,
      },
      select: {
        id: true,
        slug: true,
        status: true,
        publishedAt: true,
        reviewedAt: true,
        reviewedBy: true,
      },
    });

    return NextResponse.json({
      success: true,
      memorial: updatedMemorial,
    });
  } catch (error) {
    console.error("[ADMIN_MEMORIAL_PUBLISH_ERROR]", {
      memorialId: id,
      adminUserId: admin.userId,
      message: error?.message,
      code: error?.code,
    });

    return NextResponse.json(
      {
        error: "Failed to publish memorial.",
      },
      {
        status: 500,
      }
    );
  }
}
