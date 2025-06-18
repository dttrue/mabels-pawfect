import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  const { userId } = getAuth(req); // ✅ fix here too
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const image = await prisma.providerGallery.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  if (!image)
    return NextResponse.json({ error: "Image not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
