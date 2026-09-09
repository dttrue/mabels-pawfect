// app/api/admin/contest/[slug]/entries/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import {
  AdminUploadError,
  consumeAdminUploadGrant,
  markAdminUploadPersisted,
  readSmallJson,
  verifyAdminUploadProof,
} from "@/lib/adminCloudinaryUpload";

export const runtime = "nodejs";

function unauthorizedResponse(admin) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
  );
}

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

export async function POST(req, { params }) {
  const admin = await requireAdmin();
  if (!admin.authorized) return unauthorizedResponse(admin);

  const { slug } = (await params) || {};
  if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug))
    return NextResponse.json(
      { error: "Invalid contest slug" },
      { status: 400 }
    );

  let asset;
  try {
    const body = await readSmallJson(req);
    const title = String(body?.title || "").trim();

    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    if (body?.uploadProof?.grant?.scope?.contestSlug !== slug) {
      return NextResponse.json(
        { error: "Contest upload scope mismatch" },
        { status: 400 }
      );
    }

    asset = await verifyAdminUploadProof(
      body?.uploadProof,
      "contest-image"
    );

    const { contest, entry } = await prisma.$transaction(
      async (transaction) => {
        await consumeAdminUploadGrant(transaction, asset);
        const contest = await transaction.contest.upsert({
          where: { slug },
          create: { slug, title: `Contest ${slug}` },
          update: {},
          select: { id: true, slug: true, title: true },
        });

        const entry = await transaction.contestEntry.upsert({
          where: { contestId_title: { contestId: contest.id, title } },
          create: {
            contestId: contest.id,
            title,
            publicId: asset.publicId,
          },
          update: { publicId: asset.publicId },
          select: {
            id: true,
            title: true,
            publicId: true,
            votes: true,
            deletedAt: true,
          },
        });
        return { contest, entry };
      }
    );

    await markAdminUploadPersisted(asset.publicId, asset.resourceType);
    return NextResponse.json({ ok: true, contest, entry });
  } catch (error) {
    if (error instanceof AdminUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Contest entry creation failed");
    return NextResponse.json(
      { error: "Contest entry failed" },
      { status: 500 }
    );
  }
}
