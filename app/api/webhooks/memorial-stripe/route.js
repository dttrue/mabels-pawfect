// app/api/webhooks/memorial-stripe/route.js

export const runtime = "nodejs";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import memorialStripe from "@/lib/memorialStripe";

export async function POST(request) {
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.MEMORIAL_STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    console.error(
      "[memorial-stripe-webhook] Missing MEMORIAL_STRIPE_WEBHOOK_SECRET."
    );

    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 }
    );
  }

  let event;

  try {
    const rawBody = await request.text();

    event = memorialStripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error(
      "[memorial-stripe-webhook] Signature verification failed:",
      error?.message
    );

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const memorialId = String(session.metadata?.memorialId || "").trim();

      const paymentType = String(session.metadata?.paymentType || "").trim();

      if (paymentType !== "memorial" || !memorialId) {
        console.warn(
          "[memorial-stripe-webhook] Ignoring unrelated Checkout Session:",
          session.id
        );

        return NextResponse.json({ received: true });
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;

      const paymentStatus = session.payment_status;

      if (paymentStatus !== "paid") {
        console.warn(
          "[memorial-stripe-webhook] Checkout completed but not paid:",
          {
            sessionId: session.id,
            paymentStatus,
          }
        );

        return NextResponse.json({ received: true });
      }

      let chargeId = null;

      if (paymentIntentId) {
        const paymentIntent = await memorialStripe.paymentIntents.retrieve(
          paymentIntentId,
          {
            expand: ["latest_charge"],
          }
        );

        chargeId =
          typeof paymentIntent.latest_charge === "string"
            ? paymentIntent.latest_charge
            : paymentIntent.latest_charge?.id || null;
      }

      await prisma.petMemorial.update({
        where: {
          id: memorialId,
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          stripeChargeId: chargeId,
        },
      });

      console.log(
        "[memorial-stripe-webhook] Memorial marked PAID:",
        memorialId
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[memorial-stripe-webhook] Event processing failed:", {
      eventType: event?.type,
      message: error?.message,
    });

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
