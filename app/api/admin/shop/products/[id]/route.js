// app/api/admin/shop/products/[id]/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// small helpers
function numOrNull(value) {
  if (value === null) return null;
  if (value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/* ✅ GET /api/admin/shop/products/[id]
   Fetch one product + categories so we can hydrate the edit form */
export async function GET(_req, { params }) {
  const { id } = params || {};
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: { select: { slug: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        subtitle: product.subtitle,
        description: product.description,
        active: product.active,
        forDogs: product.forDogs,
        forCats: product.forCats,
        priceCents: product.priceCents,
        priceDollars:
          typeof product.priceCents === "number"
            ? product.priceCents / 100
            : null,
        weightOz: product.weightOz,
        weightGrams: product.weightGrams,
        lengthIn: product.lengthIn,
        lengthCm: product.lengthCm,
        widthIn: product.widthIn,
        widthCm: product.widthCm,
        heightIn: product.heightIn,
        heightCm: product.heightCm,
        categorySlugs: product.categories.map((c) => c.slug),
        deletedAt: product.deletedAt,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });
  } catch (e) {
    console.error("❌ Product GET failed:", e);
    return NextResponse.json(
      { error: "Failed to load product" },
      { status: 500 }
    );
  }
}

// ✅ DELETE /api/admin/shop/products/[id]
// Soft-deletes the product by setting deletedAt
export async function DELETE(_req, { params }) {
  try {
    const found = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true, deletedAt: true },
    });
    if (!found)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (found.deletedAt) {
      return NextResponse.json({ message: "Already deleted" }); // idempotent
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        active: false, // optional but nice: hide from shop
      },
      select: { id: true, title: true, deletedAt: true },
    });
    return NextResponse.json({ product, message: "Product deleted" });
  } catch (e) {
    console.error("❌ Product delete failed:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}

// ✅ POST /api/admin/shop/products/[id]/undo
// Restores a recently deleted product (within 15 minutes)
export async function POST(_req, { params }) {
  const { id } = params;

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || !product.deletedAt) {
      return NextResponse.json({ error: "Nothing to undo" }, { status: 404 });
    }

    const deletedTime = new Date(product.deletedAt).getTime();
    const now = Date.now();
    if (now - deletedTime > 15 * 60 * 1000) {
      return NextResponse.json(
        { error: "Undo period expired" },
        { status: 403 }
      );
    }

    const restored = await prisma.product.update({
      where: { id },
      data: { deletedAt: null, active: true },
    });

    return NextResponse.json({
      product: restored,
      message: "Product restored",
    });
  } catch (e) {
    console.error("❌ Undo failed:", e);
    return NextResponse.json({ error: "Undo failed" }, { status: 400 });
  }
}


/* -------------------- PATCH /api/admin/shop/products/[id] ------------------ */
/**
 * Full product update:
 * - title, subtitle, description
 * - priceDollars → priceCents
 * - active, forDogs, forCats
 * - weight / dimensions (imperial + metric)
 * - categorySlugs → categories relation
 */
export async function PATCH(req, { params }) {
  const { id } = params;

  try {
    const body = await req.json();

    const {
      title,
      subtitle,
      description,
      priceDollars,
      active,
      forDogs,
      forCats,
      weightOz,
      lengthIn,
      widthIn,
      heightIn,
      categorySlugs,
    } = body;

    const data = {};

    // ---- basic strings ----
    if (typeof title === "string" && title.trim()) {
      data.title = title.trim();
    }

    if ("subtitle" in body) {
      data.subtitle =
        typeof subtitle === "string" && subtitle.trim()
          ? subtitle.trim()
          : null;
    }

    if ("description" in body) {
      data.description =
        typeof description === "string" && description.trim()
          ? description.trim()
          : null;
    }

    // ---- booleans ----
    if (typeof active === "boolean") data.active = active;
    if (typeof forDogs === "boolean") data.forDogs = forDogs;
    if (typeof forCats === "boolean") data.forCats = forCats;

    // ---- price ----
    if (priceDollars !== undefined) {
      if (priceDollars === null || priceDollars === "") {
        data.priceCents = null;
      } else {
        const n = Number(priceDollars);
        const priceCents = Math.round(n * 100);
        if (
          !Number.isFinite(priceCents) ||
          priceCents < 0 ||
          priceCents > 1_000_000_00
        ) {
          return NextResponse.json({ error: "Invalid price" }, { status: 400 });
        }
        data.priceCents = priceCents;
      }
    }

    // ---- numeric helpers ----
    const toNumberOrNull = (v) => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const ozToGrams = (oz) => Number((oz * 28.3495).toFixed(2));
    const inchesToCm = (inches) => Number((inches * 2.54).toFixed(2));

    // weight / dimensions – only touch when key is present in body
    if ("weightOz" in body) {
      const w = toNumberOrNull(weightOz);
      data.weightOz = w;
      data.weightGrams = w == null ? null : ozToGrams(w);
    }

    if ("lengthIn" in body) {
      const v = toNumberOrNull(lengthIn);
      data.lengthIn = v;
      data.lengthCm = v == null ? null : inchesToCm(v);
    }

    if ("widthIn" in body) {
      const v = toNumberOrNull(widthIn);
      data.widthIn = v;
      data.widthCm = v == null ? null : inchesToCm(v);
    }

    if ("heightIn" in body) {
      const v = toNumberOrNull(heightIn);
      data.heightIn = v;
      data.heightCm = v == null ? null : inchesToCm(v);
    }

    // ---- categories ----
    if (Array.isArray(categorySlugs)) {
      data.categories = {
        set: categorySlugs.map((slug) => ({ slug })),
      };
    }

    if (!Object.keys(data).length) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        categories: { select: { slug: true } },
      },
    });

    const priceDollarsUpdated =
      product.priceCents != null ? product.priceCents / 100 : null;

    return NextResponse.json({
      product: {
        ...product,
        priceDollars: priceDollarsUpdated,
        categorySlugs: product.categories.map((c) => c.slug),
      },
    });
  } catch (e) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("❌ PATCH product failed:", e);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
