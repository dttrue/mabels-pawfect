/// app/api/get-donation/route.js

import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // or your actual Stripe version
});

export async function POST(req) {
  try {
    const { sessionId } = await req.json();
    console.log("📨 Received sessionId:", sessionId);

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("🧾 Stripe session fetched:", session);

    const amount = session.amount_total / 100; // Stripe returns amount in cents
    return NextResponse.json({ amount });
  } catch (err) {
    console.error("❌ Error fetching donation from Stripe:", err);
    return NextResponse.json(
      { error: "Failed to fetch donation amount" },
      { status: 500 }
    );
  }
}

