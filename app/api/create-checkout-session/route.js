// app/api/create-checkout-session/route.js

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const TAX_RATE_NJ = process.env.STRIPE_TAX_NJ || "txr_1STBaSGjN79HWlVreR8FWPEJ";

const MIN_DONATION_CENTS = 100;
const MAX_DONATION_CENTS = 1000000;
const MAX_DONATION_ITEMS = 5;

const DONATION_OPTIONS = {
  FOOD_LITTER: {
    name: "Food and Litter",
    description: "Help provide everyday food and fresh litter.",
    amountCents: 1000,
  },
  TOYS_ENRICHMENT: {
    name: "Toys and Enrichment",
    description: "Support toys, play, comfort, and healthy development.",
    amountCents: 1500,
  },
  KITTEN_RESCUE: {
    name: "General Rescue Care",
    description: "Help cover general rescue and foster-care expenses.",
    amountCents: 2500,
  },
  PREMIUM_RESCUE: {
    name: "Medical and Emergency Support",
    description: "Provide substantial support for rescue and medical care.",
    amountCents: 10000,
  },
};

const ALLOWED_TARGETS = new Set(["GENERAL", "FOSTER_CAT"]);

const ALLOWED_PURPOSES = new Set(["GENERAL", ...Object.keys(DONATION_OPTIONS)]);

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

function normalizeDonorName(value) {
  const name = String(value || "").trim();

  if (!name || name.length > 120) {
    return null;
  }

  return name;
}

function normalizeDonorEmail(value) {
  const email = String(value || "")
    .trim()
    .toLowerCase();

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return null;
  }

  return email;
}

function parseCustomAmountCents(value) {
  const amount = Number(value);
  const amountCents = Math.round(amount * 100);

  if (
    !Number.isFinite(amount) ||
    !Number.isInteger(amountCents) ||
    amountCents < MIN_DONATION_CENTS ||
    amountCents > MAX_DONATION_CENTS
  ) {
    return null;
  }

  return amountCents;
}

function normalizeDonationItems(body) {
  const requestedItems =
    Array.isArray(body?.items) && body.items.length > 0
      ? body.items
      : [
          {
            purpose: body?.purpose || "GENERAL",
            amount: body?.amount,
          },
        ];

  if (requestedItems.length > MAX_DONATION_ITEMS) {
    return {
      valid: false,
      error: `Please select no more than ${MAX_DONATION_ITEMS} support options.`,
    };
  }

  const normalizedItems = [];
  const selectedPurposes = new Set();

  for (const [index, requestedItem] of requestedItems.entries()) {
    if (!requestedItem || typeof requestedItem !== "object") {
      return {
        valid: false,
        error: `Invalid donation item at position ${index + 1}.`,
      };
    }

    const purpose = String(requestedItem.purpose || "")
      .trim()
      .toUpperCase();

    if (!ALLOWED_PURPOSES.has(purpose)) {
      return {
        valid: false,
        error: `Invalid donation purpose at position ${index + 1}.`,
      };
    }

    if (selectedPurposes.has(purpose)) {
      return {
        valid: false,
        error: "Each support option may only be selected once.",
      };
    }

    selectedPurposes.add(purpose);

    const fixedOption = DONATION_OPTIONS[purpose];

    if (fixedOption) {
      normalizedItems.push({
        purpose,
        name: fixedOption.name,
        description: fixedOption.description,
        amountCents: fixedOption.amountCents,
        quantity: 1,
      });

      continue;
    }

    const customAmountCents = parseCustomAmountCents(requestedItem.amount);

    if (customAmountCents === null) {
      return {
        valid: false,
        error: "Please enter a custom donation between $1 and $10,000.",
      };
    }

    normalizedItems.push({
      purpose: "GENERAL",
      name: "Custom Donation",
      description:
        "Flexible support for food, litter, enrichment, medical care, and safe temporary housing.",
      amountCents: customAmountCents,
      quantity: 1,
    });
  }

  const totalAmountCents = normalizedItems.reduce(
    (total, item) => total + item.amountCents * item.quantity,
    0
  );

  if (
    totalAmountCents < MIN_DONATION_CENTS ||
    totalAmountCents > MAX_DONATION_CENTS
  ) {
    return {
      valid: false,
      error: "The combined donation must be between $1 and $10,000.",
    };
  }

  return {
    valid: true,
    items: normalizedItems,
    totalAmountCents,
  };
}

async function createDonationCheckout(body, appBase) {
  const target = String(body?.target || "GENERAL").toUpperCase();
    const donorName = normalizeDonorName(body?.donorName);
    const donorEmail = normalizeDonorEmail(body?.donorEmail);

    if (!donorName) {
      return NextResponse.json(
        { error: "Please enter your name." },
        { status: 400 }
      );
    }

    if (!donorEmail) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

  if (!ALLOWED_TARGETS.has(target)) {
    return NextResponse.json(
      { error: "Invalid donation target." },
      { status: 400 }
    );
  }

  let fosterCat = null;

  if (target === "FOSTER_CAT") {
    const fosterCatId = String(body?.fosterCatId || "").trim();

    if (!fosterCatId) {
      return NextResponse.json(
        { error: "Please select a foster cat." },
        { status: 400 }
      );
    }

    fosterCat = await prisma.fosterCat.findFirst({
      where: {
        id: fosterCatId,
        deletedAt: null,
        isFeatured: true,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!fosterCat) {
      return NextResponse.json(
        {
          error: "That foster cat is no longer available for donations.",
        },
        { status: 404 }
      );
    }
  }

  const itemValidation = normalizeDonationItems(body);

  if (!itemValidation.valid) {
    return NextResponse.json({ error: itemValidation.error }, { status: 400 });
  }

  const donationItems = itemValidation.items;
  const donationAmountCents = itemValidation.totalAmountCents;

  // Keep the parent purpose for backward compatibility.
  // DonationItem contains the exact selections.
  const legacyPurpose =
    donationItems.length === 1 ? donationItems[0].purpose : "GENERAL";

  const purposeList = donationItems.map((item) => item.purpose).join(",");

    const metadata = {
      orderType: "donation",
      donationType: "kitten-rescue",
      target,
      purpose: legacyPurpose,
      donationPurposes: purposeList,
      donationItemCount: String(donationItems.length),
      donationAmountCents: String(donationAmountCents),
      fosterCatId: fosterCat?.id || "",
      fosterCatName: fosterCat?.name || "",
      donorName,
    };

  const stripeLineItems = donationItems.map((item) => {
    const productName = fosterCat
      ? `${item.name} for ${fosterCat.name}`
      : item.name;

    const productDescription = fosterCat
      ? `${item.description} This donation is designated for ${fosterCat.name}.`
      : item.description;

    return {
      price_data: {
        currency: "usd",
        unit_amount: item.amountCents,

        product_data: {
          name: productName,
          description: productDescription,

          metadata: {
            target,
            purpose: item.purpose,
            fosterCatId: fosterCat?.id || "",
          },
        },
      },

      quantity: item.quantity,
    };
  });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "if_required",
      customer_email: donorEmail,

      phone_number_collection: {
        enabled: true,
      },

      line_items: stripeLineItems,
      metadata,

      payment_intent_data: {
        metadata,
      },

      success_url:
        `${appBase}/donate-success` + "?session_id={CHECKOUT_SESSION_ID}",

      cancel_url: `${appBase}/donate-cancel`,
    });

  try {
      await prisma.donation.create({
        data: {
          target,
          purpose: legacyPurpose,
          amountCents: donationAmountCents,
          currency: "usd",
          fosterCatId: fosterCat?.id || null,

          donorName,
          donorEmail,

          stripeSessionId: session.id,
          status: "PENDING",

          items: {
            create: donationItems.map((item) => ({
              purpose: item.purpose,
              amountCents: item.amountCents,
              quantity: item.quantity,
            })),
          },
        },
      });
  } catch (error) {
    console.error("[checkout] failed to save pending donation:", error);

    try {
      await stripe.checkout.sessions.expire(session.id);
    } catch (expireError) {
      console.error(
        "[checkout] failed to expire untracked session:",
        expireError
      );
    }

    throw new Error("Unable to record the donation. Please try again.");
  }

  console.log("[checkout] donation session created:", {
    id: session.id,
    target,
    purposes: donationItems.map((item) => item.purpose),
    fosterCatId: fosterCat?.id || null,
    donationAmountCents,
  });

  return NextResponse.json(
    {
      url: session.url,
      sessionId: session.id,
    },
    { status: 200 }
  );
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
      return await createDonationCheckout(body, appBase);
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
        await stripe.shippingRates.retrieve(standardRate);
      } catch (error) {
        console.error("[checkout] shipping rate verification failed:", error);

        return NextResponse.json(
          {
            error:
              "Invalid Stripe shipping rate for this mode/account. Update STRIPE_RATE_STANDARD.",
          },
          { status: 400 }
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "if_required",

      phone_number_collection: {
        enabled: true,
      },

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

    return NextResponse.json(
      {
        url: session.url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[checkout] error:", {
      type: error?.type,
      code: error?.code,
      message: error?.message || error?.raw?.message,
      param: error?.param,
      httpStatus: error?.statusCode,
    });

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
