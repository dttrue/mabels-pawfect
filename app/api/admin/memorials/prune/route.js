// app/api/admin/memorials/prune/route.js

export const runtime = "nodejs";

import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_ADMIN_IDS = ["user_2xYcBxcVUeYD9RmUOhCdEErW4ef"];

export async function POST(req) {
  const { userId } = await auth();

  if (!userId || !ALLOWED_ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 15 * 60 * 1000);

  const expiredMemorials = await prisma.petMemorial.findMany({
    where: {
      deletedAt: {
        lte: cutoff,
      },
    },
    include: {
      images: true,
    },
  });

  let memorialsDeleted = 0;
  let imagesDeleted = 0;
  const failures = [];

  for (const memorial of expiredMemorials) {
    try {
      let cloudinaryFailed = false;

      for (const image of memorial.images) {
        try {
          const result = await cloudinary.uploader.destroy(image.publicId, {
            resource_type: "image",
            invalidate: true,
          });

          if (result.result !== "ok" && result.result !== "not found") {
            cloudinaryFailed = true;

            failures.push({
              memorialId: memorial.id,
              imageId: image.id,
              reason: `Cloudinary returned ${result.result}`,
            });
          } else {
            imagesDeleted++;
          }
        } catch (error) {
          cloudinaryFailed = true;

          failures.push({
            memorialId: memorial.id,
            imageId: image.id,
            reason: error?.message || "Cloudinary deletion failed.",
          });
        }
      }

      // Do not remove the database record while a Cloudinary
      // deletion is unresolved.
      if (cloudinaryFailed) {
        continue;
      }

      await prisma.$transaction([
        prisma.petMemorialImage.deleteMany({
          where: {
            memorialId: memorial.id,
          },
        }),
        prisma.petMemorial.delete({
          where: {
            id: memorial.id,
          },
        }),
      ]);

      memorialsDeleted++;
    } catch (error) {
      console.error(`[PRUNE_MEMORIAL_ERROR] ${memorial.id}:`, error);

      failures.push({
        memorialId: memorial.id,
        reason: error?.message || "Database deletion failed.",
      });
    }
  }

  return NextResponse.json({
    success: failures.length === 0,
    memorialsDeleted,
    imagesDeleted,
    failures,
  });
}
