// app/api/orders/by-session/route.js

export const runtime = "nodejs"; // ✅ Prisma requires Node runtime

// app/api/orders/by-session/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    // 1) Retrieve the Checkout Session (gives us livemode + PI)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"], // helpful for async methods too
    });

    // 2) Safety: ensure our key matches the session mode
    const keyIsTest = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
    const sessionIsLive = !!session.livemode;
    if (keyIsTest === sessionIsLive) {
      // If test key + live session OR live key + test session → mismatch
      return NextResponse.json({ error: "Stripe mode mismatch" }, { status: 400 });
    }

    const pi =
      (typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id) ?? null;

    // 3) Find the Order. Prefer the unique sessionId first, then fallback to PI.
    let order =
      (await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
        include: { items: true },
      })) ||
      (pi
        ? await prisma.order.findFirst({
            where: { stripePaymentIntentId: pi },
            include: { items: true },
          })
        : null);

    if (!order) {
      // Still not there? It’s likely the webhook hasn’t finished persisting it yet.
      // Return a 202 so the client can poll.
      return NextResponse.json(
        { pending: true, message: "Order not yet persisted. Try again shortly." },
        { status: 202 }
      );
    }

    // 4) Parse shipping address JSON for the UI
    const address = order.addressJson ? JSON.parse(order.addressJson) : null;

    return NextResponse.json(
      {
        id: order.id,
        email: order.email,
        phone: order.phone,
        name: order.name,
        address,
        subtotalCents: order.subtotalCents,
        totalCents: order.totalCents,
        currency: order.currency?.toUpperCase?.() || "USD",
        items: order.items.map((it) => ({
          id: it.id,
          title: it.title,
          qty: it.qty,
          priceCents: it.priceCents,
          productId: it.productId,
          variantId: it.variantId,
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[by-session] error:", err);
    // If the session itself wasn't found (wrong account/mode), surface 404
    if (err?.statusCode === 404) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
