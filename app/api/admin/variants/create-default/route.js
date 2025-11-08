import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST { productId, name? }  // name defaults to "Default"
export async function POST(req) {
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
