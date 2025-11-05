// app/api/admin/shop/products/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* ---------- helpers ---------- */
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parsePriceToCents(priceDollars) {
  const n = Number(String(priceDollars).replace(/[^0-9.]/g, ""));
  if (!isFinite(n) || n <= 0) throw new Error("invalid_price");
  return Math.round(n * 100);
}

function normalizeCategories(input) {
  if (!input) return [];
  const arr = Array.isArray(input)
    ? input
    : String(input)
        .split(",")
        .map((x) => x.trim());
  return arr
    .map((x) => x.toLowerCase())
    .filter(Boolean)
    .slice(0, 20); // guard
}

async function ensureUniqueSlug(base) {
  let candidate = base || "item";
  let i = 2;
  while (await prisma.product.count({ where: { slug: candidate } })) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

function capitalize(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ---------- POST: create product ---------- */
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const {
      title,
      priceDollars,
      subtitle,
      description,
      categories,
      active = true,
    } = body;

    const cleanedTitle = String(title || "").trim();
    if (!cleanedTitle) {
      return NextResponse.json({ error: "missing_title" }, { status: 400 });
    }

    const priceCents = parsePriceToCents(priceDollars);

    // server owns slug
    const baseSlug = slugify(cleanedTitle);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    const cats = normalizeCategories(categories);

    const data = {
      title: cleanedTitle,
      slug: uniqueSlug,
      priceCents,
      subtitle: subtitle || null,
      description: description || null,
      active: Boolean(active),
    };

    // If you have a Category model with unique slug and M2M:
    if (cats.length) {
      data.categories = {
        connectOrCreate: cats.map((c) => ({
          where: { slug: c },
          create: { slug: c, name: capitalize(c) },
        })),
      };
    }

    const product = await prisma.product.create({
      data,
      include: { categories: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    // Handle unique race on slug
    if (err?.code === "P2002" && err?.meta?.target?.includes("slug")) {
      return NextResponse.json({ error: "slug_conflict" }, { status: 409 });
    }
    if (err?.message === "invalid_price") {
      return NextResponse.json({ error: "invalid_price" }, { status: 400 });
    }
    console.error("🛑 Error creating product:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/* ---------- GET: list products for dropdowns ---------- */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10))
    );
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    const where = q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q } },
          ],
        }
      : {};

    const products = await prisma.product.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        priceCents: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error("🛑 Error fetching products:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
