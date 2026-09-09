// app/api/admin/contest/[slug]/entries/[id]/route.js
// DELETE /api/admin/contest/[slug]/entries/[id]

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";

function unauthorizedResponse(admin) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
  );
}

export async function DELETE(_req, context) {
  const admin = await requireAdmin();
  if (!admin.authorized) return unauthorizedResponse(admin);

  const params = await context.params;
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
