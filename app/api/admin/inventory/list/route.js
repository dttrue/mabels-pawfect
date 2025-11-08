// app/api/admin/inventory/list/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { title: "asc" },
      include: {
        variants: {
          orderBy: { name: "asc" },
          select: { id: true, name: true, priceCents: true, active: true },
        },
        inventory: { select: { variantId: true, onHand: true } },
      },
    });

    // Build response: attach onHand to each variant
    const items = products.map((p) => {
      const stock = new Map(p.inventory.map((r) => [r.variantId, r.onHand]));
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          priceCents: v.priceCents,
          active: v.active,
          onHand: stock.get(v.id) ?? 0,
        })),
        // if you keep product-level stock (you shouldn’t with variant-always), expose it here:
        productOnHand: stock.get(null) ?? 0,
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[inventory/list] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load inventory list" },
      { status: 500 }
    );
  }
}
