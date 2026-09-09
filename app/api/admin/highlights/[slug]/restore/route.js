// app/api/admin/highlights/[slug]/restore/route.js

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";

function unauthorizedResponse(admin) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
  );
}

export async function POST(_req, context) {
  const admin = await requireAdmin();
  if (!admin.authorized) return unauthorizedResponse(admin);

  const params = await context.params;
  const { slug } = params;
  const row = await prisma.highlight.update({
    where: { slug },
    data: { deletedAt: null, deletedBy: null },
  });
  return NextResponse.json({ highlight: row });
}
