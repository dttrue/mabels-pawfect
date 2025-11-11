// app/api/orders/by-session/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    // 1) Fast path: check DB by unique sessionId
    let order = await prisma.order.findUnique({
      where: { stripeSessionId: sessionId },
      include: { items: true },
    });

    // 2) If not found yet, pull the session to (a) confirm mode, (b) fallback via PI
    if (!order) {
      let session;
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId);
      } catch (e) {
        // If Stripe can’t find the session at all, surface 404 (wrong account/mode/typo)
        if (e?.statusCode === 404) {
          return NextResponse.json(
            { error: "Session not found" },
            { status: 404 }
          );
        }
        throw e; // other Stripe errors → 500 below
      }

      // Mode sanity check (helps when test objects are queried with live keys, and vice versa)
      const keyIsTest = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
      if (keyIsTest === !!session.livemode) {
        return NextResponse.json(
          { error: "Stripe mode mismatch" },
          { status: 400 }
        );
      }

      const piId =
        (typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id) ?? null;

      if (piId) {
        order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: piId },
          include: { items: true },
        });
      }
    }

    // 3) Still not there? Webhook hasn’t finished yet → tell client to poll.
    if (!order) {
      const res = NextResponse.json(
        {
          pending: true,
          message: "Order not yet persisted. Try again shortly.",
        },
        { status: 202 }
      );
      res.headers.set("Retry-After", "2"); // polite hint for clients
      return res;
    }

    // 4) Shape the payload for UI friendliness
    let address = null;
    if (order.addressJson) {
      try {
        address = JSON.parse(order.addressJson);
      } catch {
        // ignore bad JSON; keep as null
      }
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        email: order.email,
        phone: order.phone,
        name: order.name,
        address,
        subtotalCents: order.subtotalCents,
        totalCents: order.totalCents,
        currency: (order.currency || "usd").toUpperCase(),
        items: order.items.map((it) => ({
          id: it.id,
          title: it.title,
          qty: it.qty,
          priceCents: it.priceCents,
          productId: it.productId,
          variantId: it.variantId,
        })),
      },
    });
  } catch (err) {
    console.error("[by-session] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
