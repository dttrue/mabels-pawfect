// app/api/contest/[slug]/entries/[id]/route.js
// DELETE /api/contest/[slug]/entries/[id]

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(_req, { params }) {
  const { slug, id } = params || {};
  if (!slug || !id)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const entry = await prisma.contestEntry.findFirst({
    where: { id, contest: { slug } },
    select: { id: true, deletedAt: true },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!entry.deletedAt) return NextResponse.json({ ok: true });

  const windowMs = 15 * 60 * 1000;
  if (Date.now() - new Date(entry.deletedAt).getTime() > windowMs) {
    return NextResponse.json({ error: "Undo window expired" }, { status: 409 });
  }

  await prisma.contestEntry.update({
    where: { id },
    data: { deletedAt: null },
  });
  return NextResponse.json({ ok: true });
}

