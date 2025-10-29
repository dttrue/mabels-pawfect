// lib/cart.js
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

export const CART_COOKIE = "cart_id";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// READ ONLY: returns string | null
export async function readCartId() {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value || null;
}

export async function ensureCart(cartId) {
  let cart = await prisma.cart.findUnique({ where: { id: cartId } });
  if (!cart) cart = await prisma.cart.create({ data: { id: cartId } });
  return cart;
}

export function cartTotals(items) {
  const subtotalCents = items.reduce((s, it) => s + it.priceCents * it.qty, 0);
  return { subtotalCents };
}