// app/api/admin/highlights/upload/route.js

import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const title = form.get("title") || "Untitled";
    const slug = (form.get("slug") || title)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!file)
      return NextResponse.json({ error: "Missing file" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "highlights/2025",
          public_id: slug,
          overwrite: true,
          eager: [
            { streaming_profile: "hd", format: "m3u8" },
            {
              format: "mp4",
              transformation: [{ q: "auto", vc: "h264:main", f: "mp4" }],
            },
          ],
          eager_async: false,
        },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(buf);
    });

    const publicId = result.public_id; // e.g. highlights/2025/bacons-first-birthday
    const base = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}`;
    const url = `${base}/video/upload/q_auto:good,vc_h264:main/${publicId}.mp4`;
    const posterUrl = `${base}/video/upload/so_2/${publicId}.jpg`;

    return NextResponse.json(
      { title, slug, publicId, url, posterUrl },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
