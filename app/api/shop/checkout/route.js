// app/api/shop/checkout/route.js
import Stripe from "stripe";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Optional: NJ sales tax rate (exclusive)
const TAX_RATE_NJ = process.env.STRIPE_TAX_NJ || "txr_1STBaSGjN79HWlVreR8FWPEJ";

/**
 * Build an absolute base URL from request Host header (preferred)
 * with fallback to NEXT_PUBLIC_APP_URL, then localhost.
 */
function getAppBase() {
  try {
    const h = headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`;
  } catch {}
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

export async function POST(req) {
  // Basic key presence check
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[checkout] Missing STRIPE_SECRET_KEY");
    return NextResponse.json(
      { error: "Server misconfigured (stripe key)" },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { cartId, items, successUrl, cancelUrl } = body || {};
  if (!cartId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Missing cart or items" },
      { status: 400 }
    );
  }

  // Validate each item shape early to avoid Stripe 500s
  for (const [idx, i] of items.entries()) {
    if (
      !i ||
      typeof i.name !== "string" ||
      typeof i.unitAmount !== "number" ||
      !Number.isInteger(i.unitAmount) ||
      typeof i.quantity !== "number" ||
      !Number.isInteger(i.quantity) ||
      i.quantity <= 0
    ) {
      return NextResponse.json(
        { error: `Bad item at index ${idx}` },
        { status: 400 }
      );
    }
  }

  const appBase = getAppBase();

  // Mode safety: prevent test key on prod domain & vice-versa
  const keyIsTest = process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");
  const domain = appBase
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
  const looksProd = /^(www\.)?mabelspawfectpetservices\.com$/.test(domain);
  if (keyIsTest && looksProd) {
    return NextResponse.json(
      { error: "Stripe mode mismatch (test key + prod domain)" },
      { status: 400 }
    );
  }

  // 🧮 Cart subtotal in cents
  const subtotalCents = items.reduce(
    (sum, i) => sum + i.unitAmount * i.quantity,
    0
  );

  // 🚚 Shipping rates from env
  const standardRate = process.env.STRIPE_RATE_STANDARD?.trim() || null;
  const freeRate = process.env.STRIPE_RATE_FREE?.trim() || null;

  // Threshold in cents (default: $75 if not set)
  const FREE_SHIP_THRESHOLD =
    Number(process.env.STRIPE_FREE_SHIP_THRESHOLD) || 7500;

  console.log("[checkout] subtotal (cents):", subtotalCents);
  console.log("[checkout] STRIPE_RATE_STANDARD:", standardRate || "(none)");
  console.log("[checkout] STRIPE_RATE_FREE:", freeRate || "(none)");
  console.log("[checkout] FREE_SHIP_THRESHOLD (cents):", FREE_SHIP_THRESHOLD);
  console.log("[checkout] STRIPE_TAX_NJ:", TAX_RATE_NJ || "(none)");

  const qualifiesForFree = !!freeRate && subtotalCents >= FREE_SHIP_THRESHOLD;

  // Build shipping_options:
  // - < $75  -> standard only
  // - >= $75 -> free only
  let shipping_options = [];

  if (qualifiesForFree) {
    if (freeRate) {
      shipping_options = [{ shipping_rate: freeRate }];
    }
  } else {
    if (standardRate) {
      shipping_options = [{ shipping_rate: standardRate }];
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "if_required",
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      ...(shipping_options.length ? { shipping_options } : {}),
      allow_promotion_codes: true,

      // ⬇️ Tax moved onto each line item via `tax_rates`
      line_items: items.map((i) => ({
        price_data: {
          currency: "usd",
          unit_amount: i.unitAmount, // cents
          product_data: {
            name: i.name,
            metadata: {
              productId: i.productId || "",
              variantId: i.variantId || "", // empty string if default
            },
          },
        },
        quantity: i.quantity,
        ...(TAX_RATE_NJ ? { tax_rates: [TAX_RATE_NJ] } : {}),
      })),

      metadata: {
        orderType: "shop",
        cartId: String(cartId),
      },

      success_url:
        (successUrl || `${appBase}/success`) +
        `?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${appBase}/shop`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    // Stripe error transparency for server logs
    const detail = {
      type: err?.type,
      code: err?.code,
      message: err?.message || err?.raw?.message,
      param: err?.param,
      decline_code: err?.decline_code,
      rawType: err?.rawType,
      http_status: err?.statusCode,
    };
    console.error("[checkout] Stripe error:", detail);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
