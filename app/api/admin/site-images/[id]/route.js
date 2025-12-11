// app/api/admin/site-images/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(_req, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.siteImage.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("SiteImage DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete site image" },
      { status: 500 }
    );
  }
}
