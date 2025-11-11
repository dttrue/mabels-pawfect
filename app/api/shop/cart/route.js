// app/api/shop/cart/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  readCartId,
  ensureCart,
  cartTotals,
  CART_COOKIE,
  COOKIE_MAX_AGE,
} from "@/lib/cart";
import { randomBytes } from "crypto";

const isProd = process.env.NODE_ENV === "production";

function serializeCart(cart, items) {
  const enriched = items.map((it) => ({
    id: it.id,
    qty: it.qty,
    priceCents: it.priceCents,
    product: {
      id: it.product.id,
      slug: it.product.slug,
      title: it.product.title,
      imageUrl: it.product.images[0]?.url || null,
    },
    variant: it.variant ? { id: it.variant.id, name: it.variant.name } : null,
  }));
  return { id: cart.id, items: enriched, totals: cartTotals(enriched) };
}

async function loadCartAndItems(cartId) {
  const cart = await ensureCart(cartId);
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      product: { include: { images: { orderBy: { sort: "asc" } } } },
      variant: true,
    },
    orderBy: { id: "asc" },
  });
  return { cart, items };
}

function setCartCookie(res, cartId) {
  res.cookies.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: isProd, // ✅ only secure in production
  });
}

export async function GET() {
  try {
    let cartId = await readCartId();
    let setCookie = false;
    if (!cartId) {
      cartId = randomBytes(16).toString("hex");
      setCookie = true;
    }

    const { cart, items } = await loadCartAndItems(cartId);
    const res = NextResponse.json(serializeCart(cart, items));
    if (setCookie) setCartCookie(res, cartId);
    return res;
  } catch (err) {
    console.error("[cart GET] error:", err);
    return NextResponse.json({ error: "Cart load failed" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    let cartId = await readCartId();
    let setCookie = false;
    if (!cartId) {
      cartId = randomBytes(16).toString("hex");
      setCookie = true;
    }
    await ensureCart(cartId);

    const body = await req.json();
    const productId = body?.productId;
    const variantId = body?.variantId ?? null;
    const qty = Math.max(1, Math.min(Number(body?.qty ?? 1), 50)); // clamp 1..50

    if (!productId) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    // Validate product & (optional) variant and get the correct price
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
    if (!product || !product.active) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let priceCents = product.priceCents;
    if (variantId) {
      const variant = product.variants.find((v) => v.id === variantId && v.active !== false);
      if (!variant) {
        return NextResponse.json({ error: "Variant not found" }, { status: 404 });
      }
      priceCents = variant.priceCents ?? priceCents;
    }

    // Optional: enforce inventory (if you track it)
    // Look up onHand for (productId, variantId or Default)
    const invKey = { productId, variantId: variantId ?? null };

    // If you use a composite unique (productId, variantId) with non-null variantId,
    // create a helper that resolves a "Default" variantId before this check.
    const inventory = await prisma.inventory.findUnique({
      where: { productId_variantId: invKey },
    });
    if (inventory && inventory.onHand != null) {
      // Calculate existing qty in cart for this (product, variant)
      const existingForSku = await prisma.cartItem.findFirst({
        where: { cartId, productId, variantId },
      });
      const already = existingForSku?.qty ?? 0;
      if (already + qty > inventory.onHand) {
        const allowed = Math.max(0, inventory.onHand - already);
        if (allowed === 0) {
          return NextResponse.json(
            { error: "Out of stock for selected option" },
            { status: 409 }
          );
        }
        // Reduce qty to allowed
        const reducedQty = allowed;
        // fall through using reducedQty
        if (existingForSku) {
          await prisma.cartItem.update({
            where: { id: existingForSku.id },
            data: { qty: existingForSku.qty + reducedQty, priceCents },
          });
        } else {
          await prisma.cartItem.create({
            data: { cartId, productId, variantId, qty: reducedQty, priceCents },
          });
        }
        const { cart, items } = await loadCartAndItems(cartId);
        const res = NextResponse.json(serializeCart(cart, items));
        if (setCookie) setCartCookie(res, cartId);
        return res;
      }
    }

    // Upsert cart item
    const existing = await prisma.cartItem.findFirst({
      where: { cartId, productId, variantId },
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          qty: Math.min(existing.qty + qty, 50), // clamp
          priceCents, // keep price in sync with current product/variant price
        },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId, productId, variantId, qty, priceCents },
      });
    }

    const { cart, items } = await loadCartAndItems(cartId);
    const res = NextResponse.json(serializeCart(cart, items));
    if (setCookie) setCartCookie(res, cartId);
    return res;
  } catch (err) {
    console.error("[cart POST] error:", err);
    return NextResponse.json({ error: "Add to cart failed" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { cartItemId, qty } = await req.json();
    if (!cartItemId || qty == null) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    const nextQty = Math.max(0, Math.min(Number(qty), 50));

    if (nextQty <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
    } else {
      // Optional: enforce inventory on update as well
      const item = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: { product: true, variant: true },
      });
      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      const inventory = await prisma.inventory.findUnique({
        where: { productId_variantId: { productId: item.productId, variantId: item.variantId } },
      });
      if (inventory && nextQty > inventory.onHand) {
        return NextResponse.json(
          { error: `Only ${inventory.onHand} left in stock` },
          { status: 409 }
        );
      }
      await prisma.cartItem.update({ where: { id: cartItemId }, data: { qty: nextQty } });
    }

    return GET();
  } catch (err) {
    console.error("[cart PUT] error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { cartItemId } = await req.json();
    if (!cartItemId) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return GET();
  } catch (err) {
    console.error("[cart DELETE] error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
