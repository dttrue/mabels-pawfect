// app/api/shop/checkout/route.js  (or create-checkout-session)
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  console.log("========== [checkout] START ==========");

  // Stripe account check (helps detect wrong key/account)
  try {
    const acct = await stripe.accounts.retrieve();
    console.log("[checkout] using Stripe account:", acct.id);
  } catch (err) {
    console.error("[checkout] failed to retrieve account:", err?.message);
  }

  // Parse JSON
  let body;
  try {
    body = await req.json();
    console.log("[checkout] body:", body);
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

  // Validate items
  for (const [idx, i] of items.entries()) {
    if (
      !i ||
      typeof i.name !== "string" ||
      !Number.isInteger(i.unitAmount) ||
      !Number.isInteger(i.quantity) ||
      i.quantity <= 0
    ) {
      console.error("[checkout] bad item at index", idx, i);
      return NextResponse.json(
        { error: `Bad item at index ${idx}` },
        { status: 400 }
      );
    }
  }

  // Build base URL from awaited headers (Next 15)
  let appBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000";
  try {
    const h = await headers(); // ✅ await required
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    if (host) appBase = `${proto}://${host}`.replace(/\/+$/, "");
  } catch {}
  console.log("[checkout] appBase:", appBase);

  // Shipping (single standard rate, optional)
  const standardRate = process.env.STRIPE_RATE_STANDARD?.trim();
  console.log("[checkout] STRIPE_RATE_STANDARD:", standardRate || "(none)");
  const shipping_options = standardRate
    ? [{ shipping_rate: standardRate }]
    : [];
const rateEnv = process.env.STRIPE_RATE_STANDARD;
console.log(
  "[checkout] STRIPE_RATE_STANDARD (raw):",
  JSON.stringify(rateEnv),
  "len:",
  (rateEnv || "").length
);

  // Preflight verify shipping rate to catch typos/mode mismatches
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
  } else {
    console.log(
      "[checkout] No shipping rate configured; skipping shipping_options"
    );
  }

  try {
    console.log("[checkout] creating Stripe session…");
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
          unit_amount: i.unitAmount,
          product_data: {
            name: i.name,
            metadata: {
              productId: i.productId || "",
              variantId: i.variantId || "",
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

    console.log("[checkout] ✅ session created:", {
      id: session.id,
      url: session.url,
    });
    console.log("========== [checkout] END ==========");
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const detail = {
      type: err?.type,
      code: err?.code,
      message: err?.message || err?.raw?.message,
      param: err?.param,
      http_status: err?.statusCode,
    };
    console.error("[checkout] ❌ Stripe error:", detail);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
