// app/api/admin/site-images/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function DELETE(_req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin.authorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.siteImage.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch {
    console.error("SiteImage DELETE failed");
    return NextResponse.json(
      { error: "Failed to delete site image" },
      { status: 500 }
    );
  }
}
