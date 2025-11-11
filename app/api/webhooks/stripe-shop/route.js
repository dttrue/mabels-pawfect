
// app/api/webhooks/stripe-shop/route.js
export const runtime = "nodejs";

import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { generateOrderEmail } from "@/lib/emails/generateOrderEmail";
const resend = new Resend(process.env.RESEND_API_KEY);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const sig = (await headers()).get("stripe-signature");
  const raw = await req.text();
  const acct = await stripe.accounts.retrieve();
  console.log("[STRIPE SERVER]", {
    keyMode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
      ? "TEST"
      : "LIVE",
    account: acct.id,
  });


  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET_SHOP);
  } catch (err) {
    console.error("[SHOP WH] ❌ verify failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("[SHOP WH] ✔ verified", { type: event.type, id: event.id });

  if (event.type !== "checkout.session.completed") {
    console.log("[SHOP WH] skipping type:", event.type);
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  console.log("[SHOP WH] session:", { id: session.id, payment_status: session.payment_status });

  if (session.payment_status !== "paid") {
    return NextResponse.json({ skipped: "not paid" });
  }

  const cartId = session.metadata?.cartId || null;

  // 1) Pull purchased line items (expand product metadata)
  const { data: lineItems } = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ["data.price.product"],
  });

  console.log("[SHOP WH] lineItems:", lineItems.map(li => ({
    desc: li.description,
    qty: li.quantity,
    meta: li.price?.product?.metadata,
  })));

  // 2) Customer + shipping
  const customer = session.customer_details || {};
  const shipping = session.shipping_details || {};

  // 3) Upsert Order (idempotent on retries)
  let order;
  try {
    order = await prisma.order.upsert({
      where: { stripeSessionId: session.id },   // requires @unique in schema
      update: {},                                // if retry, no-op
      create: {
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent?.toString() ?? null,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
        name: shipping.name || customer.name || null,
        addressJson: shipping.address ? JSON.stringify(shipping.address) : null,
        subtotalCents: session.amount_subtotal ?? 0,
        totalCents: session.amount_total ?? 0,
        currency: session.currency || "usd",
        items: {
          create: lineItems.map((li) => {
            const meta = li.price?.product?.metadata ?? {};
            const qty = li.quantity ?? 1;
            const unit = li.amount_subtotal / (qty || 1);
            return {
              productId: meta.productId || null,
              variantId: meta.variantId || null, // default handled later
              title: li.description,
              qty,
              priceCents: Math.round(unit),
            };
          }),
        },
      },
      include: { items: true },
    });
  } catch (e) {
    console.error("[SHOP WH] order upsert failed:", e);
    return NextResponse.json({ error: "order upsert failed" }, { status: 500 });
  }

  // If this was a retry (existing order), bail before inventory/cart
  if (order.createdAt.getTime() !== order.updatedAt.getTime()) {
    console.log("[SHOP WH] deduped (order already exists):", order.id);
    return NextResponse.json({ ok: true, type: "shop", orderId: order.id, deduped: true });
  }

  // 4) Decrement inventory per line item
  for (const li of lineItems) {
    const meta = li.price?.product?.metadata ?? {};
    const productId = meta.productId;
    const rawVariantId = meta.variantId;
    const qty = li.quantity ?? 1;
    if (!productId) {
      console.warn("[SHOP WH] missing productId in metadata for item:", li.description);
      continue;
    }
    const variantId = await ensureVariantId(productId, rawVariantId);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.inventory.upsert({
          where: { productId_variantId: { productId, variantId } },
          update: {},
          create: { productId, variantId, onHand: 0 },
        });
        await tx.inventory.update({
          where: { productId_variantId: { productId, variantId } },
          data: { onHand: { decrement: qty } },
        });
        await tx.inventoryLog.create({
          data: {
            productId,
            variantId,
            action: "SALE",
            delta: -qty,
            reason: `Stripe order ${order.id}`,
            source: "stripe_webhook",
          },
        });
      });
    } catch (e) {
      console.error("[SHOP WH] inventory tx failed:", { productId, variantId, qty, err: e });
      // don’t throw: the order itself is already persisted
    }
  }

  // 5) Clear cart
  if (cartId) {
    try {
      await prisma.cartItem.deleteMany({ where: { cartId } });
    } catch (e) {
      console.error("[SHOP] cart clear failed:", e);
    }
  }

  console.log("[SHOP WH] ✅ order done:", order.id);
  return NextResponse.json({ ok: true, type: "shop", orderId: order.id });
}

// If this was a retry (existing order), bail before inventory/cart/emails
if (order.createdAt.getTime() !== order.updatedAt.getTime()) {
  console.log("[SHOP WH] deduped (order already exists):", order.id);
  return NextResponse.json({ ok: true, type: "shop", orderId: order.id, deduped: true });
}

// 🔔 Send notification email
try {
  const html = generateOrderEmail({ order, items: order.items });
  await resend.emails.send({
    from: "Shop Alerts <no-reply@mabelspawfectpetservices.com>",
    to: [
      "therainbowniche@gmail.com",                // Bridget
      "danieltorres.dt@gmail.com"                 // You (optional)
    ],
    subject: `🛍️ New Order #${order.id.slice(0,8)} · ${(order.totalCents/100).toFixed(2)} ${order.currency?.toUpperCase() || "USD"}`,
    html,
  });
  console.log("[SHOP WH] 📬 order email sent:", order.id);
} catch (e) {
  console.error("[SHOP WH] email failed:", e);
}

async function ensureVariantId(productId, rawVariantId) {
  if (rawVariantId && rawVariantId !== "") return rawVariantId;
  let v = await prisma.variant.findFirst({ where: { productId, name: "Default" } });
  if (!v) v = await prisma.variant.create({ data: { productId, name: "Default" } });
  return v.id;
}
