// app/api/admin/gallery/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch all images (no user filter needed anymore)
export async function GET() {
  try {
    const images = await prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(images);
  } catch (err) {
    console.error("🛑 Gallery fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Upload new image (no provider needed)
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const caption = formData.get("caption");
    const altText = formData.get("altText");
    const category = formData.get("category");
    const keywordsRaw = formData.get("keywords"); // ✅ New field

    if (!file || typeof file !== "object") {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, "-")}`;

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: new URLSearchParams({
          file: `data:${file.type};base64,${buffer.toString("base64")}`,
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          public_id: fileName,
          folder: "bridget-gallery",
        }),
      }
    );

    const data = await cloudRes.json();

    if (!data.secure_url || !data.public_id) {
      return NextResponse.json(
        { error: "Cloudinary upload failed" },
        { status: 500 }
      );
    }

    // ✅ Sanitize keywords string (comma-separated, lowercase, trimmed)
    const keywords = keywordsRaw
      ? keywordsRaw
          .split(",")
          .map((kw) => kw.trim().toLowerCase())
          .filter((kw) => kw.length > 0)
          .slice(0, 10) // max 10
      : [];

    const newImage = await prisma.gallery.create({
      data: {
        imageUrl: data.secure_url,
        publicId: data.public_id,
        caption: caption || null,
        altText: altText || null,
        category: category || "HAPPY",
        // ✅ Assuming you've added this field in your schema
        keywords: keywords.join(", "),
      },
    });

    return NextResponse.json(newImage);
  } catch (err) {
    console.error("🛑 Gallery upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

