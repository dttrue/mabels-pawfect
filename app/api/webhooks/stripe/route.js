// app/api/webhooks/stripe/route.js

export const runtime = "nodejs";

import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

const API_VERSION = "2024-09-30.acacia";

const ALLOWED_TARGETS = new Set(["GENERAL", "FOSTER_CAT"]);

const ALLOWED_PURPOSES = new Set([
  "GENERAL",
  "FOOD_LITTER",
  "TOYS_ENRICHMENT",
  "KITTEN_RESCUE",
  "PREMIUM_RESCUE",
]);

function getDonationStripe() {
  const secretKey = process.env.STRIPE_DONATION_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("STRIPE_DONATION_SECRET_KEY is missing.");
  }

  return new Stripe(secretKey, {
    apiVersion: API_VERSION,
  });
}

function getWebhookSecret() {
  const webhookSecret = process.env.STRIPE_DONATION_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    throw new Error("STRIPE_DONATION_WEBHOOK_SECRET is missing.");
  }

  return webhookSecret;
}

function getStripeId(value) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id || null;
}

function getDonationMetadata(session) {
  const metadata = session.metadata || {};

  const requestedTarget = String(metadata.target || "GENERAL").toUpperCase();

  const requestedPurpose = String(metadata.purpose || "GENERAL").toUpperCase();

  const target = ALLOWED_TARGETS.has(requestedTarget)
    ? requestedTarget
    : "GENERAL";

  const purpose = ALLOWED_PURPOSES.has(requestedPurpose)
    ? requestedPurpose
    : "GENERAL";

  const parsedAmount = Number.parseInt(
    String(metadata.donationAmountCents || ""),
    10
  );

  const amountCents =
    Number.isInteger(session.amount_total) && session.amount_total > 0
      ? session.amount_total
      : parsedAmount;

  return {
    target,
    purpose,
    amountCents,
    fosterCatId:
      target === "FOSTER_CAT" && metadata.fosterCatId
        ? metadata.fosterCatId
        : null,
  };
}

async function getPaymentInformation(session) {
  const stripe = getDonationStripe();
  const paymentIntentId = getStripeId(session.payment_intent);

  if (!paymentIntentId) {
    return {
      paymentIntentId: null,
      chargeId: null,
    };
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });

  return {
    paymentIntentId,
    chargeId: getStripeId(paymentIntent.latest_charge),
  };
}

async function getCheckoutSessionForPaymentIntent(paymentIntentId) {
  const stripe = getDonationStripe();

  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });

  return sessions.data[0] || null;
}

async function markDonationPaid(session, eventCreated) {
  const donation = getDonationMetadata(session);

  if (!Number.isInteger(donation.amountCents) || donation.amountCents <= 0) {
    throw new Error(`Invalid donation amount for Stripe session ${session.id}`);
  }

  let verifiedFosterCatId = null;

  if (donation.target === "FOSTER_CAT" && donation.fosterCatId) {
    const fosterCat = await prisma.fosterCat.findUnique({
      where: {
        id: donation.fosterCatId,
      },
      select: {
        id: true,
      },
    });

    verifiedFosterCatId = fosterCat?.id || null;
  }

  // Preserve the donation if the foster cat was removed after
  // Checkout began, but convert its destination to the general fund.
  const finalTarget = verifiedFosterCatId
    ? "FOSTER_CAT"
    : donation.target === "FOSTER_CAT"
      ? "GENERAL"
      : donation.target;

  const { paymentIntentId, chargeId } = await getPaymentInformation(session);

  const donorName =
    session.customer_details?.name?.trim() ||
    session.metadata?.donorName?.trim() ||
    null;

  const donorEmail =
    session.customer_details?.email?.trim()?.toLowerCase() ||
    session.customer_email?.trim()?.toLowerCase() ||
    null;

  const donorPhone = session.customer_details?.phone?.trim() || null;

  const paidAt = new Date(eventCreated * 1000);

  /*
   * The pending Donation and its DonationItem records are created
   * before the donor is redirected to Stripe. Updating instead of
   * upserting prevents incomplete paid records without line items.
   */
  await prisma.donation.update({
    where: {
      stripeSessionId: session.id,
    },
    data: {
      target: finalTarget,
      purpose: donation.purpose,
      amountCents: donation.amountCents,
      currency: session.currency || "usd",
      fosterCatId: verifiedFosterCatId,

      ...(donorName ? { donorName } : {}),
      ...(donorEmail ? { donorEmail } : {}),
      ...(donorPhone ? { donorPhone } : {}),

      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId,

      status: "PAID",
      paidAt,
      failedAt: null,
    },
  });

  console.log("[donation webhook] donation marked paid:", {
    stripeSessionId: session.id,
    amountCents: donation.amountCents,
  });
}

async function markDonationFailed(session, eventCreated) {
  const failedAt = new Date(eventCreated * 1000);

  await prisma.donation.updateMany({
    where: {
      stripeSessionId: session.id,
      status: "PENDING",
    },
    data: {
      status: "FAILED",
      failedAt,
    },
  });
}

async function markDonationRefunded(charge, eventCreated) {
  const chargeId = getStripeId(charge);
  const paymentIntentId = getStripeId(charge.payment_intent);
  const refundedAt = new Date(eventCreated * 1000);

  if (!chargeId && !paymentIntentId) {
    return;
  }

  await prisma.donation.updateMany({
    where: {
      OR: [
        ...(chargeId ? [{ stripeChargeId: chargeId }] : []),
        ...(paymentIntentId
          ? [{ stripePaymentIntentId: paymentIntentId }]
          : []),
      ],
    },
    data: {
      status: "REFUNDED",
      refundedAt,
    },
  });
}

export async function POST(req) {
  let stripe;
  let webhookSecret;

  try {
    stripe = getDonationStripe();
    webhookSecret = getWebhookSecret();
  } catch (error) {
    console.error("[donation webhook] configuration error:", {
      message: error?.message,
    });

    return NextResponse.json(
      { error: "Donation webhook is not configured." },
      { status: 500 }
    );
  }

  const signature = (await headers()).get("stripe-signature");
  const rawBody = await req.text();

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error(
      "[donation webhook] signature verification failed:",
      error?.message
    );

    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        if (paymentIntent.metadata?.orderType !== "donation") {
          break;
        }

        const session = await getCheckoutSessionForPaymentIntent(
          paymentIntent.id
        );

        if (!session) {
          throw new Error(
            `No Checkout Session found for PaymentIntent ${paymentIntent.id}`
          );
        }

        await markDonationPaid(session, event.created);
        break;
      }

      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;

        if (
          session.metadata?.orderType === "donation" &&
          session.payment_status === "paid"
        ) {
          await markDonationPaid(session, event.created);
        }

        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object;

        if (session.metadata?.orderType === "donation") {
          await markDonationFailed(session, event.created);
        }

        break;
      }

      case "charge.refunded": {
        await markDonationRefunded(event.data.object, event.created);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({
      received: true,
      type: event.type,
    });
  } catch (error) {
    console.error("[donation webhook] processing failed:", {
      eventId: event.id,
      eventType: event.type,
      message: error?.message,
      code: error?.code,
    });

    return NextResponse.json(
      { error: "Donation webhook processing failed." },
      { status: 500 }
    );
  }
}
