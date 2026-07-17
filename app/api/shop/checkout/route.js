// app/api/shop/checkout/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  isSummerSaleActive,
  getSummerSalePriceCents,
} from "@/lib/summerSaleHelpers";
import { SUMMER_TOY_CLEAROUT } from "@/lib/summerSaleConfig";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const TAX_RATE_NJ = process.env.STRIPE_TAX_NJ || "txr_1STBaSGjN79HWlVreR8FWPEJ";

async function getAppBase() {
  try {
    const headerStore = await headers();
    const host = headerStore.get("host");
    const proto = headerStore.get("x-forwarded-proto") || "https";

    if (host) {
      return `${proto}://${host}`.replace(/\/+$/, "");
    }
  } catch {}

  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

function buildPlainLineItems(items, taxRateId) {
  return items.map((item) => ({
    price_data: {
      currency: "usd",
      unit_amount: item.unitAmount,
      product_data: {
        name: item.name,
        metadata: {
          productId: item.productId || "",
          variantId: item.variantId || "",
          slug: item.slug || "",
        },
      },
    },
    quantity: item.quantity,
    ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
  }));
}

function buildLineItemsWithSummerSale(items, taxRateId) {
  return items.map((item) => {
    const salePriceCents = item.slug
      ? getSummerSalePriceCents(item.slug, item.unitAmount)
      : null;

    const unitAmount =
      Number.isInteger(salePriceCents) &&
      salePriceCents > 0 &&
      salePriceCents < item.unitAmount
        ? salePriceCents
        : item.unitAmount;

    const isOnSale = unitAmount !== item.unitAmount;

    return {
      price_data: {
        currency: "usd",
        unit_amount: unitAmount,
        product_data: {
          name: isOnSale ? `${item.name} — Summer Sale` : item.name,
          metadata: {
            productId: item.productId || "",
            variantId: item.variantId || "",
            slug: item.slug || "",
            originalUnitAmount: String(item.unitAmount),
            saleUnitAmount: isOnSale ? String(unitAmount) : "",
            campaign: isOnSale ? SUMMER_TOY_CLEAROUT.campaign : "",
          },
        },
      },
      quantity: item.quantity,
      ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
    };
  });
}

function isAuthorizedEmployeeRequest(req) {
  const incomingKey = req.headers.get("x-admin-key")?.trim() || "";

  const expectedKey = process.env.ADMIN_SECRET?.trim() || "";

  if (!expectedKey) {
    console.error("[checkout] ADMIN_SECRET is not configured");

    return false;
  }

  return incomingKey === expectedKey;
}

function validateItems(items) {
  for (const [index, item] of items.entries()) {
    if (
      !item ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      !Number.isInteger(item.unitAmount) ||
      item.unitAmount <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return `Bad item at index ${index}`;
    }
  }

  return null;
}

export async function POST(req) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[checkout] Missing STRIPE_SECRET_KEY");

    return NextResponse.json(
      {
        error: "Server misconfigured (Stripe key)",
      },
      {
        status: 500,
      }
    );
  }

  let body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON",
      },
      {
        status: 400,
      }
    );
  }

  const {
    cartId,
    items,
    successUrl,
    cancelUrl,
    employeeCheckout = false,
  } = body || {};

  if (!cartId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      {
        error: "Missing cart or items",
      },
      {
        status: 400,
      }
    );
  }

  const itemValidationError = validateItems(items);

  if (itemValidationError) {
    return NextResponse.json(
      {
        error: itemValidationError,
      },
      {
        status: 400,
      }
    );
  }

  const requestedEmployeeCheckout = employeeCheckout === true;

  const authorizedEmployeeCheckout =
    requestedEmployeeCheckout && isAuthorizedEmployeeRequest(req);

  if (requestedEmployeeCheckout && !authorizedEmployeeCheckout) {
    console.warn("[checkout] Rejected unauthorized employee checkout");

    return NextResponse.json(
      {
        error: "Employee checkout is not authorized",
      },
      {
        status: 403,
      }
    );
  }

  const appBase = await getAppBase();

  const keyIsTest = process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");

  const domain = appBase
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  const looksProd = /^(www\.)?mabelspawfectpetservices\.com$/.test(domain);

  if (keyIsTest && looksProd) {
    return NextResponse.json(
      {
        error: "Stripe mode mismatch (test key + production domain)",
      },
      {
        status: 400,
      }
    );
  }

  const summerSaleActive = isSummerSaleActive();

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.unitAmount * item.quantity,
    0
  );

  const standardRate = process.env.STRIPE_RATE_STANDARD?.trim() || null;

  const freeRate = process.env.STRIPE_RATE_FREE?.trim() || null;

  const freeShippingThreshold =
    Number(process.env.STRIPE_FREE_SHIP_THRESHOLD) || 7500;

  const employeePromotionCode =
    process.env.STRIPE_EMPLOYEE_PROMOTION_CODE?.trim() || null;

  if (authorizedEmployeeCheckout && !employeePromotionCode) {
    console.error("[checkout] STRIPE_EMPLOYEE_PROMOTION_CODE is missing");

    return NextResponse.json(
      {
        error: "Employee discount is not configured",
      },
      {
        status: 500,
      }
    );
  }

  if (authorizedEmployeeCheckout && !freeRate) {
    console.error("[checkout] STRIPE_RATE_FREE is missing");

    return NextResponse.json(
      {
        error: "Employee free shipping is not configured",
      },
      {
        status: 500,
      }
    );
  }

  const qualifiesForPublicFreeShipping =
    Boolean(freeRate) && subtotalCents >= freeShippingThreshold;

  const selectedShippingRate =
    authorizedEmployeeCheckout || qualifiesForPublicFreeShipping
      ? freeRate
      : standardRate;

  const shippingOptions = selectedShippingRate
    ? [
        {
          shipping_rate: selectedShippingRate,
        },
      ]
    : [];

  console.log("[checkout] configuration:", {
    subtotalCents,
    summerSaleActive,
    requestedEmployeeCheckout,
    authorizedEmployeeCheckout,
    selectedShippingRate,
    freeShippingThreshold,
  });

  try {
    /*
     * Employee checkout uses the original prices and then
     * applies the 50% Stripe promotion code.
     *
     * This prevents the employee discount from stacking with
     * the automatic Summer Sale pricing.
     */
    const lineItems = summerSaleActive
      ? buildLineItemsWithSummerSale(items, TAX_RATE_NJ)
      : buildPlainLineItems(items, TAX_RATE_NJ);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "if_required",

      phone_number_collection: {
        enabled: true,
      },

      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },

      ...(shippingOptions.length
        ? {
            shipping_options: shippingOptions,
          }
        : {}),

      ...(authorizedEmployeeCheckout
        ? {
            discounts: [
              {
                promotion_code: employeePromotionCode,
              },
            ],
          }
        : {
            allow_promotion_codes: true,
          }),

      line_items: lineItems,

      metadata: {
        orderType: "shop",
        cartId: String(cartId),

        checkoutType: authorizedEmployeeCheckout ? "EMPLOYEE" : "PUBLIC",

        employeeCheckout: String(authorizedEmployeeCheckout),

        campaign: authorizedEmployeeCheckout
          ? "EMPLOYEE_50"
          : summerSaleActive
            ? SUMMER_TOY_CLEAROUT.campaign
            : "STANDARD_SHOP_CHECKOUT",
      },

      success_url:
        (successUrl || `${appBase}/success`) +
        "?session_id={CHECKOUT_SESSION_ID}",

      cancel_url:
        cancelUrl ||
        (authorizedEmployeeCheckout
          ? `${appBase}/admin1313/employee-store`
          : `${appBase}/shop`),
    });

    return NextResponse.json(
      {
        url: session.url,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    const detail = {
      type: error?.type,
      code: error?.code,
      message: error?.message || error?.raw?.message,
      param: error?.param,
      declineCode: error?.decline_code,
      rawType: error?.rawType,
      httpStatus: error?.statusCode,
    };

    console.error("[checkout] Stripe error:", detail);

    return NextResponse.json(
      {
        error: detail.message || "Failed to create checkout session",
      },
      {
        status: 500,
      }
    );
  }
}
