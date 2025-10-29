// app/api/shop/cart/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import  prisma  from "@/lib/prisma";
import {
  readCartId,
  ensureCart,
  cartTotals,
  CART_COOKIE,
  COOKIE_MAX_AGE,
} from "@/lib/cart";
import { randomBytes } from "crypto";

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

export async function GET() {
  let cartId = await readCartId();
  let setCookie = false;
  if (!cartId) {
    cartId = randomBytes(16).toString("hex");
    setCookie = true;
  }

  const { cart, items } = await loadCartAndItems(cartId);
  const res = NextResponse.json(serializeCart(cart, items));
  if (setCookie) {
    res.cookies.set(CART_COOKIE, cartId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }
  return res;
}

export async function POST(req) {
  let cartId = await readCartId();
  let setCookie = false;
  if (!cartId) {
    cartId = randomBytes(16).toString("hex");
    setCookie = true;
  }
  await ensureCart(cartId);

  const { productId, variantId = null, qty = 1 } = await req.json();
  if (!productId || qty <= 0)
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productId, variantId },
  });
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { qty: existing.qty + qty },
    });
  } else {
    const prod = await prisma.product.findUnique({ where: { id: productId } });
    if (!prod || !prod.active)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    await prisma.cartItem.create({
      data: { cartId, productId, variantId, qty, priceCents: prod.priceCents },
    });
  }

  const { cart, items } = await loadCartAndItems(cartId);
  const res = NextResponse.json(serializeCart(cart, items));
  if (setCookie) {
    res.cookies.set(CART_COOKIE, cartId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }
  return res;
}

export async function PUT(req) {
  const { cartItemId, qty } = await req.json();
  if (!cartItemId || qty == null)
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  if (qty <= 0) await prisma.cartItem.delete({ where: { id: cartItemId } });
  else
    await prisma.cartItem.update({ where: { id: cartItemId }, data: { qty } });

  return GET(); // will handle cookie response if needed
}

export async function DELETE(req) {
  const { cartItemId } = await req.json();
  if (!cartItemId)
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await prisma.cartItem.delete({ where: { id: cartItemId } });
  return GET();
}
