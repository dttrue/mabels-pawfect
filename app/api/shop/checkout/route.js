// app/api/shop/checkout/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import  prisma  from "@/lib/prisma";
import {
  readCartId,
  ensureCart,
  cartTotals,
  CART_COOKIE,
  COOKIE_MAX_AGE,
} from "@/lib/cart";
import { randomBytes } from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-09-30.acacia",
});

const USD = (cents) => Math.max(0, Math.round(cents)); // guard

export async function POST(req) {
  // ensure cart id exists (and set cookie if new in the response)
  let cartId = await readCartId();
  let setCookie = false;
  if (!cartId) {
    cartId = randomBytes(16).toString("hex");
    setCookie = true;
  }
  await ensureCart(cartId);

  // load items
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: { product: true, variant: true },
  });

  if (!items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const subtotal = cartTotals(items).subtotalCents;

  // SHIPPING RULE: free at $75+, else $6 flat
  const FREE_THRESHOLD = 7500; // cents
  const STANDARD_RATE_CENTS = 600;

  const includeFree = subtotal >= FREE_THRESHOLD;
  const shippingOptions = [];

  if (includeFree) {
    shippingOptions.push({
      shipping_rate_data: {
        display_name: "Free shipping",
        type: "fixed_amount",
        fixed_amount: { amount: 0, currency: "usd" },
        delivery_estimate: {
          minimum: { unit: "business_day", value: 3 },
          maximum: { unit: "business_day", value: 7 },
        },
      },
    });
  } else {
    shippingOptions.push({
      shipping_rate_data: {
        display_name: "Standard",
        type: "fixed_amount",
        fixed_amount: { amount: USD(STANDARD_RATE_CENTS), currency: "usd" },
        delivery_estimate: {
          minimum: { unit: "business_day", value: 3 },
          maximum: { unit: "business_day", value: 7 },
        },
      },
    });
  }

  // build line items from cart
  const line_items = items.map((it) => ({
    quantity: it.qty,
    price_data: {
      currency: "usd",
      unit_amount: USD(it.priceCents),
      product_data: {
        name: it.product.title + (it.variant ? ` — ${it.variant.name}` : ""),
        description: it.product.subtitle ?? undefined,
      },
    },
  }));

  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || (await req.url));
  const success_url = `${url.origin}/shop/thank-you?session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${url.origin}/shop`;


  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: undefined, // collected at checkout
    line_items,
    success_url,
    cancel_url,
    allow_promotion_codes: true,
    shipping_address_collection: { allowed_countries: ["US"] },
    shipping_options: shippingOptions,
    metadata: { cartId },
  });

  const res = NextResponse.json({ url: session.url });
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
