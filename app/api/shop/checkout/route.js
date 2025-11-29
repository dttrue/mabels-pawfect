// app/api/shop/checkout/route.js
import Stripe from "stripe";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { BLACK_FRIDAY_PROMO } from "@/lib/blackFridayConfig";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Manual NJ sales tax for TOYS ONLY (line items)
//    - Shipping tax is handled in Stripe with the 0% “No Tax (Shipping Only)” rate
//      attached to the shipping rate, so we do NOT touch shipping tax here.
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

/**
 * 🔥 Black Friday BOGO 50% OFF helper
 *
 * - Expands cart into per-unit list
 * - Sorts by price DESC
 * - Applies 50% off to the *second* most expensive unit
 * - Rebuilds Stripe line_items with:
 *    • all other units at full price
 *    • ONE unit at half price
 * - Preserves quantity grouping where possible
 */
function buildLineItemsWithBogo50(items, taxRateId) {
  const eligibleSlugs = Array.isArray(BLACK_FRIDAY_PROMO?.eligibleSlugs)
    ? new Set(BLACK_FRIDAY_PROMO.eligibleSlugs)
    : null;

  // Helper: plain, no-discount line items
  const buildPlainLineItems = () =>
    items.map((i) => ({
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
      ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
    }));

  // If we somehow have no config, just bail to normal pricing
  if (!eligibleSlugs) {
    return buildPlainLineItems();
  }

  // 🔥 Build unit list **only from eligible items**
  const unitList = [];
  items.forEach((item, idx) => {
    const slug = item.slug;
    const isEligible = slug && eligibleSlugs.has(slug);

    if (!isEligible) return;

    for (let q = 0; q < item.quantity; q++) {
      unitList.push({ idx, unitAmount: item.unitAmount });
    }
  });

  // Fewer than 2 eligible units → no BOGO at all
  if (unitList.length < 2) {
    return buildPlainLineItems();
  }

  // Sort eligible units by price DESC so “buy 1, get 2nd of equal/lesser value 50% off”
  unitList.sort((a, b) => b.unitAmount - a.unitAmount);

  // Mark discounted units: every 2nd unit in each pair (1–2, 3–4, 5–6, …)
  const discountedCountByItem = new Map(); // idx -> count
  for (let i = 1; i < unitList.length; i += 2) {
    const { idx } = unitList[i];
    discountedCountByItem.set(idx, (discountedCountByItem.get(idx) || 0) + 1);
  }

  const lineItems = [];

  items.forEach((item, idx) => {
    const discountedQty = discountedCountByItem.get(idx) || 0;
    const fullQty = item.quantity - discountedQty;

    const baseProduct = {
      product_data: {
        name: item.name,
        metadata: {
          productId: item.productId || "",
          variantId: item.variantId || "",
        },
      },
    };

    // Full-price units (includes all non-eligible toys)
    if (fullQty > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: item.unitAmount,
          ...baseProduct,
        },
        quantity: fullQty,
        ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
      });
    }

    // 50%-off units (eligible items only)
    if (discountedQty > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.unitAmount / 2),
          ...baseProduct,
        },
        quantity: discountedQty,
        ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
      });
    }
  });

  return lineItems;
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

  // 🧮 Cart subtotal in cents (pre-discount, for shipping thresholds)
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
  console.log(
    "[checkout] STRIPE_TAX_NJ (items only):",
    TAX_RATE_NJ || "(none)"
  );

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
    // 🔥 Apply Black Friday BOGO 50% OFF to line items (products)
    const lineItems = buildLineItemsWithBogo50(items, TAX_RATE_NJ);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "if_required",
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      ...(shipping_options.length ? { shipping_options } : {}),
      allow_promotion_codes: true,

      line_items: lineItems,

      metadata: {
        orderType: "shop",
        cartId: String(cartId),
        campaign: "BLACK_FRIDAY_BOGO_50",
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
