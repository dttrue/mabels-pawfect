// app/api/get-donation/route.js

import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDonationStripe() {
  const secretKey = process.env.STRIPE_DONATION_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("Donation Stripe is not configured.");
  }

  return new Stripe(secretKey, {
    apiVersion: "2024-09-30.acacia",
  });
}

function stripeModesMatch(secretKey, sessionId) {
  const testKey =
    secretKey.startsWith("sk_test_") || secretKey.startsWith("rk_test_");

  const testSession = sessionId.startsWith("cs_test_");

  return testKey === testSession;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const sessionId = String(body?.sessionId || "").trim();

    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json(
        { error: "A valid donation session is required." },
        { status: 400 }
      );
    }

    const secretKey = process.env.STRIPE_DONATION_SECRET_KEY?.trim() || "";

    if (!secretKey) {
      return NextResponse.json(
        { error: "Donation payments are not configured." },
        { status: 500 }
      );
    }

    if (!stripeModesMatch(secretKey, sessionId)) {
      return NextResponse.json(
        { error: "The donation session is unavailable." },
        { status: 400 }
      );
    }

    const stripe = getDonationStripe();

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent.latest_charge"],
    });

    if (session.metadata?.orderType !== "donation") {
      return NextResponse.json(
        { error: "Donation session not found." },
        { status: 404 }
      );
    }

    const paymentIntent =
      session.payment_intent && typeof session.payment_intent === "object"
        ? session.payment_intent
        : null;

    const latestCharge =
      paymentIntent?.latest_charge &&
      typeof paymentIntent.latest_charge === "object"
        ? paymentIntent.latest_charge
        : null;

    return NextResponse.json({
      amount: (session.amount_total ?? 0) / 100,
      receiptUrl: latestCharge?.receipt_url || "",
      paymentStatus: session.payment_status || "unpaid",
    });
  } catch (error) {
    console.error("[get donation] error:", {
      type: error?.type,
      code: error?.code,
      message: error?.message,
    });

    return NextResponse.json(
      { error: "Failed to fetch donation details." },
      { status: 500 }
    );
  }
}
