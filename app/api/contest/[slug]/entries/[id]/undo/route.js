// app/api/contest/[slug]/entries/[id]/undo/route.js
// POST /api/contest/[slug]/entries/[id]/undo

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const GRACE_MS = 15 * 60 * 1000;

export async function POST(_req, { params }) {
  const { slug, id } = params || {};
  if (!slug || !id)
    return NextResponse.json({ error: "Missing slug or id" }, { status: 400 });

  const entry = await prisma.contestEntry.findFirst({
    where: { id, contest: { slug } },
    select: { id: true, deletedAt: true },
  });
  if (!entry)
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  if (!entry.deletedAt)
    return NextResponse.json({
      ok: true,
      restored: false,
      reason: "not_deleted",
    });

  const age = Date.now() - new Date(entry.deletedAt).getTime();
  if (age > GRACE_MS) {
    return NextResponse.json(
      { ok: false, reason: "undo_window_expired" },
      { status: 409 }
    );
  }

  const restored = await prisma.contestEntry.update({
    where: { id },
    data: { deletedAt: null },
    select: { id: true, deletedAt: true },
  });

  return NextResponse.json({ ok: true, restored: true, entry: restored });
}
