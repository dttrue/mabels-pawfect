// app/api/webhooks/stripe/route.js

export const runtime = "nodejs";

import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-09-30.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const ALLOWED_TARGETS = new Set(["GENERAL", "FOSTER_CAT"]);
const ALLOWED_PURPOSES = new Set([
  "GENERAL",
  "FOOD_LITTER",
  "TOYS_ENRICHMENT",
  "KITTEN_RESCUE",
  "PREMIUM_RESCUE",
]);

function getStripeId(value) {
  if (!value) return null;
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

  // Preserve the money even if the cat was removed after checkout started.
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

  await prisma.donation.upsert({
    where: {
      stripeSessionId: session.id,
    },

    create: {
      target: finalTarget,
      purpose: donation.purpose,
      amountCents: donation.amountCents,
      currency: session.currency || "usd",
      fosterCatId: verifiedFosterCatId,

      donorName,
      donorEmail,
      donorPhone,

      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId,

      status: "PAID",
      paidAt,
    },

    update: {
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

  console.log("[webhook] donation marked paid:", {
    stripeSessionId: session.id,
    target: finalTarget,
    purpose: donation.purpose,
    fosterCatId: verifiedFosterCatId,
    amountCents: donation.amountCents,
  });
}

async function markDonationFailed(session, eventCreated) {
  const failedAt = new Date(eventCreated * 1000);

  const result = await prisma.donation.updateMany({
    where: {
      stripeSessionId: session.id,
      status: "PENDING",
    },
    data: {
      status: "FAILED",
      failedAt,
    },
  });

  console.log("[webhook] donation marked failed:", {
    stripeSessionId: session.id,
    updated: result.count,
  });
}

async function markDonationRefunded(charge, eventCreated) {
  const chargeId = getStripeId(charge);
  const paymentIntentId = getStripeId(charge.payment_intent);
  const refundedAt = new Date(eventCreated * 1000);

  const result = await prisma.donation.updateMany({
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

  console.log("[webhook] donation marked refunded:", {
    chargeId,
    paymentIntentId,
    updated: result.count,
  });
}

async function clearCompletedShopCart(session) {
  const cartId = session.metadata?.cartId || null;

  if (!cartId) {
    console.warn("[webhook] shop session is missing cartId:", session.id);
    return;
  }

  try {
    await prisma.cartItem.deleteMany({
      where: {
        cartId,
      },
    });

    console.log("[webhook] cleared completed shop cart:", cartId);
  } catch (error) {
    // Preserve the existing behavior so Stripe does not repeatedly retry
    // a successfully paid shop checkout solely because cart cleanup failed.
    console.error("[webhook] failed clearing shop cart:", error);
  }
}

export async function POST(req) {
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is missing");

    return NextResponse.json(
      { error: "Webhook is not configured" },
      { status: 500 }
    );
  }

  const signature = (await headers()).get("stripe-signature");
  const rawBody = await req.text();

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    console.log("[webhook] received event:", {
      id: event.id,
      type: event.type,
    });
  } catch (error) {
    console.error("[webhook] signature verification failed:", error.message);

    return new NextResponse(`Webhook Error: ${error.message}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const orderType = session.metadata?.orderType;

        console.log("[webhook] completed checkout:", {
          sessionId: session.id,
          orderType,
          paymentStatus: session.payment_status,
          metadata: session.metadata,
        });

        if (orderType === "donation" && session.payment_status === "paid") {
          await markDonationPaid(session, event.created);
          break;
        }

        // Existing shop logic...

        if (orderType === "shop" || (!orderType && session.metadata?.cartId)) {
          if (session.payment_status === "paid") {
            await clearCompletedShopCart(session);
          }
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
    console.error("[webhook] event processing failed:", {
      eventId: event.id,
      eventType: event.type,
      message: error?.message,
      error,
    });

    // Returning 500 tells Stripe to retry the webhook.
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
