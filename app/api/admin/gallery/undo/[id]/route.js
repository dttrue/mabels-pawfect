// app/api/admin/gallery/undo/route.js

import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restored = await prisma.gallery.update({
    where: { id: params.id },
    data: { deletedAt: null },
  });

  return NextResponse.json({ success: true, restored });
}
