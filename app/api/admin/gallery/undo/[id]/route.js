import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  const { userId } = getAuth(req); // ✅ use request-based auth
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const restored = await prisma.providerGallery.update({
    where: { id: params.id },
    data: { deletedAt: null },
  });

  return NextResponse.json({ success: true, restored });
}
