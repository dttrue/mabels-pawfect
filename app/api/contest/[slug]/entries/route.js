// app/api/admin/contest/[slug]/entries/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req, ctx) {
  const { slug } = await ctx.params; // ✅
  if (!slug)
    return NextResponse.json(
      { error: "Missing contest slug" },
      { status: 400 }
    );

  const contest = await prisma.contest.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!contest) return NextResponse.json({ entries: [] }, { status: 200 });

  const base = await prisma.contestEntry.findMany({
    where: { contestId: contest.id, deletedAt: null },
    select: {
      id: true,
      title: true,
      publicId: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  const grouped = await prisma.contestVote.groupBy({
    by: ["entryId"],
    where: { contestId: contest.id },
    _count: { entryId: true },
  });
  const map = Object.fromEntries(
    grouped.map((g) => [g.entryId, g._count.entryId])
  );

  const entries = base
    .map((e) => ({ ...e, votes: map[e.id] ?? 0 }))
    .sort(
      (a, b) =>
        b.votes - a.votes || new Date(a.createdAt) - new Date(b.createdAt)
    );

  return NextResponse.json(
    { entries },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}

// (Optional) keep POST here if your Uploader posts to the admin path
export async function POST(req, { params }) {
  const { slug } = params || {};
  if (!slug)
    return NextResponse.json(
      { error: "Missing contest slug" },
      { status: 400 }
    );

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const title = (body?.title || "").trim();
  const publicId = (body?.publicId || "").trim();
  if (!title || !publicId)
    return NextResponse.json(
      { error: "title and publicId required" },
      { status: 400 }
    );

  const contest = await prisma.contest.upsert({
    where: { slug },
    create: { slug, title: `Contest ${slug}` },
    update: {},
    select: { id: true, slug: true, title: true },
  });

  const entry = await prisma.contestEntry.upsert({
    where: { contestId_title: { contestId: contest.id, title } },
    create: { contestId: contest.id, title, publicId },
    update: { publicId },
    select: {
      id: true,
      title: true,
      publicId: true,
      votes: true,
      deletedAt: true,
    },
  });

  return NextResponse.json({ ok: true, contest, entry });
}
