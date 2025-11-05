// app/api/admin/highlights/[slug]/restore/route.js

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req, { params }) {
  const { slug } = params;
  const row = await prisma.highlight.update({
    where: { slug },
    data: { deletedAt: null, deletedBy: null },
  });
  return NextResponse.json({ highlight: row });
}
