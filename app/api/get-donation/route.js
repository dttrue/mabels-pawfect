// app/api/get-donation/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function POST(req) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId)
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

    const key = process.env.STRIPE_SECRET_KEY || "";
    console.log("🔑 key prefix:", key.slice(0, 10)); // must be sk_test_ or rk_test_
    console.log("🧾 sessionId:", sessionId.slice(0, 12)); // cs_test_...

    // Guard against mode mismatch
    const isTestKey = key.startsWith("sk_test_") || key.startsWith("rk_test_");
    const isTestSession = sessionId.startsWith("cs_test_");
    if (isTestKey !== isTestSession) {
      return NextResponse.json(
        {
          error:
            "Stripe mode mismatch: use sk_test/rk_test with cs_test and sk_live/rk_live with cs_live.",
        },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent.charges"],
    });

    const amount = (session.amount_total ?? 0) / 100;
    const receiptUrl =
      session.payment_intent?.charges?.data?.[0]?.receipt_url || "";
    return NextResponse.json({ amount, receiptUrl });
  } catch (err) {
    console.error("❌ get-donation error:", err);
    return NextResponse.json(
      { error: "Failed to fetch donation amount" },
      { status: 500 }
    );
  }
}
