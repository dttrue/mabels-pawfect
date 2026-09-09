// app/api/admin/site-images/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

// Public reads are used to render website images without signing in.
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    if (key) {
      const image = await prisma.siteImage.findUnique({ where: { key } });
      return NextResponse.json({ image: image || null });
    }

    // 🔥 list all site images for the admin list
    const images = await prisma.siteImage.findMany({
      orderBy: [{ key: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ images });
  } catch {
    console.error("SiteImage GET failed");
    return NextResponse.json(
      { error: "Failed to load site images" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const admin = await requireAdmin();
    if (!admin.authorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: "Use the verified site-image upload endpoint" },
      { status: 410 }
    );
  } catch {
    console.error("SiteImage POST failed");
    return NextResponse.json(
      { error: "Failed to save site image" },
      { status: 500 }
    );
  }
}
