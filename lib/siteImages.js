// lib/siteImages.js
import prisma from "@/lib/prisma";

export async function getSiteImage(key) {
  if (!key) return null;

  try {
    const image = await prisma.siteImage.findUnique({
      where: { key },
    });
    return image;
  } catch (err) {
    console.error("getSiteImage error:", err);
    return null;
  }
}
