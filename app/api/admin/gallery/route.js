// app/api/admin/gallery/route.js
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch images
export async function GET(req) {
  const { userId } = getAuth(req); // ✅ works in route handlers
  console.log("🧠 Clerk userId at /gallery:", userId);

  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.providerUser.findUnique({
    where: { clerkId: userId },
  });

  if (!provider)
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const gallery = await prisma.providerGallery.findMany({
    where: { providerId: provider.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(gallery);
}

// POST: Upload image
export async function POST(req) {
  const { userId } = getAuth(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.providerUser.findUnique({
    where: { clerkId: userId },
  });

  if (!provider)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  const caption = formData.get("caption");

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

  const image = await prisma.providerGallery.create({
    data: {
      providerId: provider.id,
      imageUrl: data.secure_url,
      publicId: data.public_id,
      caption: caption || null,
    },
  });

  return NextResponse.json(image);
}