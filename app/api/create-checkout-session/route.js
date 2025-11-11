// app/api/create-checkout-session/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const acct = await stripe.accounts.retrieve();
console.log("[checkout] using stripe account:", acct.id);

// Build base URL from request Host (fallback to NEXT_PUBLIC_APP_URL or localhost)
function getAppBase() {
  try {
    const h = headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`.replace(/\/+$/, "");
  } catch {}
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

export async function POST(req) {
  // Parse body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { cartId, items, successUrl, cancelUrl } = body || {};
  if (!cartId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Missing cart or items" },
      { status: 400 }
    );
  }

  // Validate each item (Stripe requires integer cents & integer qty)
  for (const [idx, i] of items.entries()) {
    if (
      !i ||
      typeof i.name !== "string" ||
      !Number.isInteger(i.unitAmount) ||
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

  // Build shipping options (standard only; optional)
  const standardRate = process.env.STRIPE_RATE_STANDARD?.trim();
  const shipping_options = standardRate
    ? [{ shipping_rate: standardRate }]
    : [];

  // Preflight verify the standard rate so we fail fast with clear error
  if (standardRate) {
    try {
      const r = await stripe.shippingRates.retrieve(standardRate);
      console.log(
        "[checkout] shipping rate OK:",
        r.id,
        r.display_name,
        r.fixed_amount?.amount
      );
    } catch (e) {
      console.error("[checkout] shipping rate verify failed:", {
        id: standardRate,
        type: e?.type,
        code: e?.code,
        message: e?.message,
      });
      return NextResponse.json(
        {
          error:
            "Invalid Stripe shipping rate for this mode/account. Update STRIPE_RATE_STANDARD to a LIVE rate ID.",
        },
        { status: 400 }
      );
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

      line_items: items.map((i) => ({
        price_data: {
          currency: "usd",
          unit_amount: i.unitAmount, // integer cents
          product_data: {
            name: i.name,
            metadata: {
              productId: i.productId || "",
              variantId: i.variantId || "", // allow empty = default
            },
          },
        },
        quantity: i.quantity,
      })),

      metadata: { orderType: "shop", cartId: String(cartId) },

      success_url:
        (successUrl || `${appBase}/success`) +
        `?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${appBase}/shop`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const detail = {
      type: err?.type,
      code: err?.code,
      message: err?.message || err?.raw?.message,
      param: err?.param,
      http_status: err?.statusCode,
    };
    console.error("[checkout] Stripe error:", detail);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
