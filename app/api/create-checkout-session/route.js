// app/api/create-checkout-session/route.js

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const TAX_RATE_NJ = process.env.STRIPE_TAX_NJ || "txr_1STBaSGjN79HWlVreR8FWPEJ";

const MIN_DONATION_CENTS = 100;
const MAX_DONATION_CENTS = 1000000;

async function getAppBase() {
  let appBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000";

  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("host");
    const proto = requestHeaders.get("x-forwarded-proto") || "https";

    if (host) {
      appBase = `${proto}://${host}`.replace(/\/+$/, "");
    }
  } catch (error) {
    console.error("[checkout] unable to resolve request host:", error);
  }

  return appBase;
}

function validateShopItems(items) {
  for (const [index, item] of items.entries()) {
    if (
      !item ||
      typeof item.name !== "string" ||
      !Number.isInteger(item.unitAmount) ||
      item.unitAmount <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return {
        valid: false,
        error: `Bad item at index ${index}`,
      };
    }
  }

  return { valid: true };
}

export async function POST(req) {
  console.log("========== [checkout] START ==========");

  let body;

  try {
    body = await req.json();
    console.log("[checkout] body:", body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const appBase = await getAppBase();
  const isDonation = body?.donationType === "kitten-rescue";

  try {
    if (isDonation) {
      const donationAmount = Number(body?.amount);
      const donationAmountCents = Math.round(donationAmount * 100);

      if (
        !Number.isFinite(donationAmount) ||
        !Number.isInteger(donationAmountCents) ||
        donationAmountCents < MIN_DONATION_CENTS ||
        donationAmountCents > MAX_DONATION_CENTS
      ) {
        return NextResponse.json(
          {
            error: "Please enter a donation amount between $1 and $10,000.",
          },
          { status: 400 }
        );
      }

      console.log("[checkout] creating donation session:", {
        donationType: body.donationType,
        donationAmountCents,
      });

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_creation: "if_required",

        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: donationAmountCents,
              product_data: {
                name: "Kitten Rescue Fund Donation",
                description:
                  "Support food, litter, formula, medical care, and safe temporary housing for rescued kittens.",
              },
            },
            quantity: 1,
          },
        ],

        metadata: {
          orderType: "donation",
          donationType: "kitten-rescue",
          donationAmountCents: String(donationAmountCents),
        },

        payment_intent_data: {
          metadata: {
            orderType: "donation",
            donationType: "kitten-rescue",
            donationAmountCents: String(donationAmountCents),
          },
        },

        success_url: `${appBase}/donate-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appBase}/donate-cancel`,
      });

      console.log("[checkout] donation session created:", {
        id: session.id,
        url: session.url,
      });

      return NextResponse.json({ url: session.url }, { status: 200 });
    }

    const { cartId, items, successUrl, cancelUrl } = body || {};

    if (!cartId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing cart or items" },
        { status: 400 }
      );
    }

    const itemValidation = validateShopItems(items);

    if (!itemValidation.valid) {
      console.error("[checkout]", itemValidation.error);

      return NextResponse.json(
        { error: itemValidation.error },
        { status: 400 }
      );
    }

    const standardRate = process.env.STRIPE_RATE_STANDARD?.trim();
    const shippingOptions = standardRate
      ? [{ shipping_rate: standardRate }]
      : [];

    if (standardRate) {
      try {
        const shippingRate = await stripe.shippingRates.retrieve(standardRate);

        console.log("[checkout] shipping rate verified:", {
          id: shippingRate.id,
          name: shippingRate.display_name,
          amount: shippingRate.fixed_amount?.amount,
        });
      } catch (error) {
        console.error("[checkout] shipping rate verification failed:", {
          id: standardRate,
          type: error?.type,
          code: error?.code,
          message: error?.message,
        });

        return NextResponse.json(
          {
            error:
              "Invalid Stripe shipping rate for this mode/account. Update STRIPE_RATE_STANDARD to a valid rate ID.",
          },
          { status: 400 }
        );
      }
    }

    console.log("[checkout] creating shop session");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "if_required",
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      ...(shippingOptions.length ? { shipping_options: shippingOptions } : {}),
      allow_promotion_codes: true,
      ...(TAX_RATE_NJ ? { default_tax_rates: [TAX_RATE_NJ] } : {}),

      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          unit_amount: item.unitAmount,
          product_data: {
            name: item.name,
            metadata: {
              productId: item.productId || "",
              variantId: item.variantId || "",
            },
          },
        },
        quantity: item.quantity,
      })),

      metadata: {
        orderType: "shop",
        cartId: String(cartId),
      },

      success_url:
        (successUrl || `${appBase}/success`) +
        "?session_id={CHECKOUT_SESSION_ID}",

      cancel_url: cancelUrl || `${appBase}/shop`,
    });

    console.log("[checkout] shop session created:", {
      id: session.id,
      url: session.url,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    const detail = {
      type: error?.type,
      code: error?.code,
      message: error?.message || error?.raw?.message,
      param: error?.param,
      httpStatus: error?.statusCode,
    };

    console.error("[checkout] Stripe error:", detail);

    return NextResponse.json(
      {
        error: error?.message || "Failed to create checkout session",
      },
      { status: 500 }
    );
  } finally {
    console.log("========== [checkout] END ==========");
  }
}
