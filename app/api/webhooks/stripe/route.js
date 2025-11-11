export const runtime = "nodejs";

import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-09-30.acacia",
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const sig = (await headers()).get("stripe-signature");
  const raw = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("[webhook] session.completed id:", session.id);
    console.log("[webhook] payment_status:", session.payment_status);
    console.log("[webhook] metadata:", session.metadata);
    console.log("[webhook] customer_details:", session.customer_details);

    if (session.payment_status !== "paid") {
      console.log("[webhook] skipping, not paid");
      return NextResponse.json({ skipped: true });
    }

    const cartId = session.metadata?.cartId || null;
    if (!cartId) {
      console.warn("[webhook] missing cartId metadata");
      return NextResponse.json({ ok: true, note: "no cartId provided" });
    }

    try {
      const before = await prisma.cartItem.count({ where: { cartId } });
      console.log(
        `[webhook] cartItem count before delete for ${cartId}:`,
        before
      );

      await prisma.cartItem.deleteMany({ where: { cartId } });

      const after = await prisma.cartItem.count({ where: { cartId } });
      console.log(
        `[webhook] cartItem count after delete for ${cartId}:`,
        after
      );
    } catch (e) {
      console.error("[webhook] failed clearing cart:", e);
      // still return 200 so Stripe stops retrying; but log loudly
    }

    return NextResponse.json({ ok: true });
  }

  // Ignore other events for now
  return NextResponse.json({ received: true });
}
