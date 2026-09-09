import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";

function unauthorizedResponse(admin) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
  );
}

// POST { productId, name? }  // name defaults to "Default"
export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin.authorized) return unauthorizedResponse(admin);

  try {
    const { productId, name = "Default" } = await req.json();
    if (!productId)
      return NextResponse.json(
        { error: "productId required" },
        { status: 400 }
      );

    const variant = await prisma.$transaction(async (tx) => {
      // if a variant already exists with that name, just return it
      let v = await tx.variant.findFirst({ where: { productId, name } });
      if (!v) {
        v = await tx.variant.create({ data: { productId, name } });
      }
      // ensure inventory row exists
      await tx.inventory.upsert({
        where: { productId_variantId: { productId, variantId: v.id } },
        update: {},
        create: { productId, variantId: v.id, onHand: 0 },
      });
      return v;
    });

    return NextResponse.json({ ok: true, variant });
  } catch (err) {
    console.error("[variants/create-default] error:", err);
    return NextResponse.json(
      { error: "Failed to create default variant" },
      { status: 500 }
    );
  }
}
