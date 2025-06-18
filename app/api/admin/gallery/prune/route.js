import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Optional: List of users allowed to trigger hard deletes
const ALLOWED_ADMIN_IDS = [
  "user_2xYcBxcVUeYD9RmUOhCdEErW4ef", // Daniel
];

export async function POST(req) {
  const { userId } = getAuth(req);
  if (!userId || !ALLOWED_ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000); // 15 mins ago

  const expiredImages = await prisma.providerGallery.findMany({
    where: {
      deletedAt: { lte: cutoff },
    },
  });

  let deletedCount = 0;

  for (const image of expiredImages) {
    try {
      await cloudinary.uploader.destroy(image.publicId);
      await prisma.providerGallery.delete({ where: { id: image.id } });
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
