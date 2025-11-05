// app/api/admin/highlights/[slug]/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(req, { params }) {
  const { slug } = params;
  const url = new URL(req.url);
  const hard = url.searchParams.get("hard") === "1";
  const deletedBy = "admin"; // TODO: pull from session/user

  const row = await prisma.highlight.update({
    where: { slug },
    data: { deletedAt: new Date(), deletedBy },
  });

  if (hard) {
    try {
      await cloudinary.uploader.destroy(row.publicId, {
        resource_type: row.type === "video" ? "video" : "image",
      });
    } catch (e) {
      // don’t fail request if Cloudinary delete hiccups
    }
  }

  return NextResponse.json({ ok: true, highlight: row });
}
export async function GET(_req, { params }) {
  const { slug } = params;
  const row = await prisma.highlight.findUnique({ where: { slug } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ highlight: row });
}

export async function PATCH(req, { params }) {
  const { slug } = params;
  const body = await req.json();

  // whitelist updatable fields
  const data = {};
  for (const k of ["title", "type", "url", "posterUrl", "startSec"]) {
    if (k in body) data[k] = body[k];
  }

  const row = await prisma.highlight.update({
    where: { slug },
    data,
  });

  return NextResponse.json({ highlight: row });
}