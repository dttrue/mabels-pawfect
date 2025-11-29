// app/api/shop/checkout/route.js
import Stripe from "stripe";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";

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
  // Expand items into a flat list of units so we can find the 2nd most expensive one
  const unitList = [];
  items.forEach((item, idx) => {
    for (let q = 0; q < item.quantity; q++) {
      unitList.push({ idx, unitAmount: item.unitAmount });
    }
  });

  // If fewer than 2 units in cart, no BOGO – just return normal line items
  if (unitList.length < 2) {
    return items.map((i) => ({
      price_data: {
        currency: "usd",
        unit_amount: i.unitAmount, // cents
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
  }

  // Sort units by price DESC so we discount the "second item of equal/lesser value"
  unitList.sort((a, b) => b.unitAmount - a.unitAmount);

  // Second most expensive unit
  const [, second] = unitList;
  const discountedIndex = second.idx;

  const lineItems = [];

  items.forEach((item, idx) => {
    const base = {
      product_data: {
        name: item.name,
        metadata: {
          productId: item.productId || "",
          variantId: item.variantId || "",
        },
      },
    };

    // All non-discounted items stay at full price
    if (idx !== discountedIndex) {
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: item.unitAmount,
          ...base,
        },
        quantity: item.quantity,
        ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
      });
      return;
    }

    // This is the item that gets ONE unit 50% off
    const qty = item.quantity;

    if (qty === 1) {
      // Only one unit of this item – just discount that one
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.unitAmount / 2),
          ...base,
        },
        quantity: 1,
        ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
      });
    } else {
      // Multiple quantity:
      // (qty - 1) units full price, + 1 unit at half price
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: item.unitAmount,
          ...base,
        },
        quantity: qty - 1,
        ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
      });

      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.unitAmount / 2),
          ...base,
        },
        quantity: 1,
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
