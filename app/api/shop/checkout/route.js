// app/api/create-checkout-session/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { cartId, items, successUrl, cancelUrl } = await req.json();
    // items: [{ productId, variantId, name, unitAmount, quantity }]

    if (!cartId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing cart or items" },
        { status: 400 }
      );
    }

    // Build base URL from env (live or preview)
    const appBase =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
      "http://localhost:3000";

    // Mode safety: prevent test key + prod domain (and vice versa)
    const keyIsTest = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
    const baseLooksProd =
      /^https:\/\/(www\.)?mabelspawfectpetservices\.com$/i.test(appBase);
    if (keyIsTest && baseLooksProd) {
      return NextResponse.json(
        { error: "Stripe mode mismatch (test key + prod domain)" },
        { status: 400 }
      );
    }

    // Shipping rates (optional: only include ones provided)
    const shipping_options = []
      .concat(
        process.env.STRIPE_RATE_STANDARD
          ? [{ shipping_rate: process.env.STRIPE_RATE_STANDARD }]
          : []
      )
      .concat(
        process.env.STRIPE_RATE_EXPRESS
          ? [{ shipping_rate: process.env.STRIPE_RATE_EXPRESS }]
          : []
      );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      customer_creation: "if_required",
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      ...(shipping_options.length ? { shipping_options } : {}),

      allow_promotion_codes: true,

      line_items: items.map((i) => ({
        price_data: {
          currency: "usd",
          unit_amount: i.unitAmount, // cents
          product_data: {
            name: i.name,
            metadata: {
              productId: i.productId,
              variantId: i.variantId || "", // empty string if default
            },
          },
        },
        quantity: i.quantity,
      })),

      metadata: {
        orderType: "shop",
        cartId,
      },

      // Use provided URLs or fall back to app base
      success_url:
        (successUrl || `${appBase}/success`) +
        `?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${appBase}/shop`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    console.error("Stripe (shop) error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
