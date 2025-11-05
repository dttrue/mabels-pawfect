// app/api/admin/highlights/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const {
      title,
      slug,
      publicId,
      url,
      posterUrl,
      startSec,
      type = "video",
    } = await req.json();
    if (!title || !slug || !publicId || !url) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const row = await prisma.highlight.upsert({
      where: { slug },
      update: { title, publicId, url, posterUrl, startSec, type },
      create: { title, slug, publicId, url, posterUrl, startSec, type },
    });

    return NextResponse.json({ highlight: row }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Save failed" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const includeDeleted = url.searchParams.get("includeDeleted") === "1";

  const rows = await prisma.highlight.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      url: true,
      posterUrl: true,
      type: true,
      publicId: true,
      deletedAt: true,
    },
  });

  return NextResponse.json({ highlights: rows });
}