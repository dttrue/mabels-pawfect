// app/api/admin/contest/[slug]/entries/[id]/route.js
// DELETE /api/admin/contest/[slug]/entries/[id]

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(_req, { params }) {
  const { slug, id } = params || {};
  if (!slug || !id)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const contest = await prisma.contest.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!contest)
    return NextResponse.json({ error: "contest_not_found" }, { status: 404 });

  const entry = await prisma.contestEntry.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  });

  return NextResponse.json({ ok: true, entry });
}
