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
import {
  isSummerSaleActive,
  getSummerSalePriceCents,
} from "@/lib/summerSaleHelpers";

const isProd = process.env.NODE_ENV === "production";

function serializeCart(cart, items) {
  const summerSaleActive = isSummerSaleActive();

  const enriched = items.map((it) => {
    const originalPriceCents = it.priceCents;

    const salePriceCents = summerSaleActive
      ? getSummerSalePriceCents(it.product.slug, originalPriceCents)
      : null;

    const isSummerSale =
      Number.isInteger(salePriceCents) &&
      salePriceCents > 0 &&
      salePriceCents < originalPriceCents;

    const finalPriceCents = isSummerSale ? salePriceCents : originalPriceCents;

    return {
      id: it.id,
      qty: it.qty,

      // active cart/display price
      priceCents: finalPriceCents,

      // sale display data
      originalPriceCents,
      salePriceCents: isSummerSale ? salePriceCents : null,
      isSummerSale,

      product: {
        id: it.product.id,
        slug: it.product.slug,
        title: it.product.title,
        imageUrl: it.product.images[0]?.url || null,
      },

      variant: it.variant
        ? {
            id: it.variant.id,
            name: it.variant.name,
          }
        : null,
    };
  });

  const originalSubtotalCents = enriched.reduce(
    (sum, item) => sum + item.originalPriceCents * item.qty,
    0
  );

  const saleSubtotalCents = enriched.reduce(
    (sum, item) => sum + item.priceCents * item.qty,
    0
  );

  const discountCents = Math.max(0, originalSubtotalCents - saleSubtotalCents);

  const totals = {
    subtotalCents: originalSubtotalCents,
    discountCents,
    totalCents: saleSubtotalCents,
    promos: enriched
      .filter((item) => item.isSummerSale)
      .map((item) => ({
        type: "SUMMER_TOY_CLEAROUT",
        label: "Summer Toy Clearout",
        cartItemId: item.id,
        productSlug: item.product.slug,
        originalPriceCents: item.originalPriceCents,
        salePriceCents: item.salePriceCents,
        qty: item.qty,
        savingsCents:
          Math.max(0, item.originalPriceCents - item.salePriceCents) * item.qty,
      })),
  };

  return {
    id: cart.id,
    items: enriched,
    totals,
  };
}

async function loadCartAndItems(cartId) {
  const cart = await ensureCart(cartId);

  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      product: {
        include: {
          images: {
            orderBy: { sort: "asc" },
          },
        },
      },
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
    secure: isProd,
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
    const qty = Math.max(1, Math.min(Number(body?.qty ?? 1), 50));

    if (!productId) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    // Validate product and optional variant
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    if (!product || !product.active) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Store original/base price in CartItem.
    // Summer sale pricing is applied dynamically in serializeCart().
    let priceCents = product.priceCents;

    if (variantId) {
      const variant = product.variants.find(
        (v) => v.id === variantId && v.active !== false
      );

      if (!variant) {
        return NextResponse.json(
          { error: "Variant not found" },
          { status: 404 }
        );
      }

      priceCents = variant.priceCents ?? priceCents;
    }

    // Optional inventory enforcement
    const invKey = { productId, variantId: variantId ?? null };

    const inventory = await prisma.inventory.findUnique({
      where: { productId_variantId: invKey },
    });

    if (inventory && inventory.onHand != null) {
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

        if (existingForSku) {
          await prisma.cartItem.update({
            where: { id: existingForSku.id },
            data: {
              qty: existingForSku.qty + allowed,
              priceCents,
            },
          });
        } else {
          await prisma.cartItem.create({
            data: {
              cartId,
              productId,
              variantId,
              qty: allowed,
              priceCents,
            },
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
          qty: Math.min(existing.qty + qty, 50),
          priceCents,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId,
          productId,
          variantId,
          qty,
          priceCents,
        },
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
      const item = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: { product: true, variant: true },
      });

      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      const inventory = await prisma.inventory.findUnique({
        where: {
          productId_variantId: {
            productId: item.productId,
            variantId: item.variantId,
          },
        },
      });

      if (inventory && nextQty > inventory.onHand) {
        return NextResponse.json(
          { error: `Only ${inventory.onHand} left in stock` },
          { status: 409 }
        );
      }

      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { qty: nextQty },
      });
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
