// app/api/create-checkout-session/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  console.log("========== [checkout] create-checkout-session START ==========");

  // 🔹 Check which account this key belongs to
  try {
    const acct = await stripe.accounts.retrieve();
    console.log("[checkout] using Stripe account:", acct.id);
  } catch (err) {
    console.error(
      "[checkout] failed to retrieve Stripe account:",
      err?.message
    );
  }

  // 🔹 Helper to determine app base URL
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

  // 🔹 Parse request JSON
  let body;
  try {
    body = await req.json();
    console.log("[checkout] parsed body:", body);
  } catch {
    console.error("[checkout] failed to parse JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { cartId, items, successUrl, cancelUrl } = body || {};
  if (!cartId || !Array.isArray(items) || items.length === 0) {
    console.error("[checkout] missing cartId or items", { cartId, items });
    return NextResponse.json(
      { error: "Missing cart or items" },
      { status: 400 }
    );
  }

  // 🔹 Validate line items
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

  const appBase = getAppBase();
  console.log("[checkout] appBase:", appBase);

  // 🔹 Build shipping options
  const standardRate = process.env.STRIPE_RATE_STANDARD?.trim();
  console.log("[checkout] STRIPE_RATE_STANDARD:", standardRate);
  const shipping_options = standardRate
    ? [{ shipping_rate: standardRate }]
    : [];

  // 🔹 Verify shipping rate before proceeding
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
      "[checkout] No shipping rate configured — skipping shipping_options"
    );
  }

  // 🔹 Create checkout session
  try {
    console.log("[checkout] creating Stripe checkout session...");
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

    console.log("[checkout] ✅ Stripe session created successfully:", {
      id: session.id,
      url: session.url,
    });

    console.log("========== [checkout] create-checkout-session END ==========");
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
    console.log(
      "========== [checkout] create-checkout-session FAILED =========="
    );
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
