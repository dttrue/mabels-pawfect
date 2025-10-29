// app/api/contest/[slug]/vote/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

function ipFrom(req) {
  const xff = req.headers.get("x-forwarded-for");
  return (
    xff?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0.0.0.0"
  );
}
const sha = (s) =>
  crypto
    .createHash("sha256")
    .update(String(s ?? ""))
    .digest("hex");

export async function POST(req, ctx) {
  // ✅ await params in App Router
  const { slug } = await ctx.params;

  if (!slug) {
    return NextResponse.json(
      { error: "Missing contest slug" },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const entryId = body?.entryId?.trim();
  if (!entryId) {
    return NextResponse.json({ error: "Missing entryId" }, { status: 400 });
  }

  // Resolve contest & entry (ensure entry belongs to the slug)
  const contest = await prisma.contest.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!contest)
    return NextResponse.json({ error: "contest_not_found" }, { status: 404 });

  const entry = await prisma.contestEntry.findFirst({
    where: { id: entryId, contestId: contest.id },
    select: { id: true, contestId: true },
  });
  if (!entry)
    return NextResponse.json({ error: "entry_not_found" }, { status: 404 });

  // Server-side fingerprint (don’t trust client)
  const ipHash = sha(ipFrom(req));
  const uaHash = sha(req.headers.get("user-agent"));

  let duplicate = false;

  try {
    // Record vote; keep your denormalized bump for compatibility (optional)
    await prisma.$transaction([
      prisma.contestVote.create({
        data: {
          contestId: entry.contestId,
          entryId: entry.id,
          ipHash,
          uaHash,
        },
      }),
      prisma.contestEntry.update({
        where: { id: entry.id },
        data: { votes: { increment: 1 } }, // optional: safe to keep for now
      }),
    ]);
  } catch (e) {
    // Unique constraint on (entryId, ipHash) → already voted for this entry
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      duplicate = true;
    } else {
      console.error("vote error", e);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  }

  // Authoritative recount from ContestVote (prevents drift)
  const grouped = await prisma.contestVote.groupBy({
    by: ["entryId"],
    where: { contestId: entry.contestId },
    _count: { entryId: true },
  });
  const counts = Object.fromEntries(
    grouped.map((g) => [g.entryId, g._count.entryId])
  );

  // Always 200 for expected outcomes; client reads `duplicate`
  return NextResponse.json(
    { ok: true, duplicate, counts },
    { headers: { "Cache-Control": "no-store" } }
  );
}