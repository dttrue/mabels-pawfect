// app/api/admin/gallery/prune/route.js
import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST() {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const now = new Date();
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000); // 15 mins ago

  const expiredImages = await prisma.gallery.findMany({
    where: {
      deletedAt: { lte: cutoff },
    },
  });

  let deletedCount = 0;

  for (const image of expiredImages) {
    try {
      await cloudinary.uploader.destroy(image.publicId);
      await prisma.gallery.delete({ where: { id: image.id } });
      deletedCount++;
    } catch (err) {
      console.error(`❌ Failed to delete ${image.id}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    message: `🧹 Purged ${deletedCount} expired images.`,
  });
}
