// app/api/webhooks/stripe-shop/route.js
export const runtime = "nodejs";

import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOrderEmail } from "@/lib/emails/generateOrderEmail";
import {
  createResendClient,
  sendRequiredEmail,
} from "@/lib/emails/resend";

function getShopStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey);
}

export async function POST(req) {
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  const stripe = getShopStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_SHOP?.trim();

  if (!stripe || !webhookSecret) {
    console.error("[SHOP WH] Webhook is not configured.");
    return NextResponse.json(
      { error: "Shop webhook is not configured." },
      { status: 503 }
    );
  }

  const raw = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch {
    console.error("[SHOP WH] Signature verification failed.");
    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 }
    );
  }

  console.log("[SHOP WH] ✔ verified", { type: event.type, id: event.id });

  if (event.type !== "checkout.session.completed") {
    console.log("[SHOP WH] skipping type:", event.type);
    return NextResponse.json({ received: true });
  }

  try {
    const session = event.data.object;
    if (session.payment_status !== "paid") {
      console.log("[SHOP WH] skipped: session not paid");
      return NextResponse.json({ skipped: "not paid" });
    }

  const cartId = session.metadata?.cartId || null;

  // Pull customer + shipping details (preferred shipping, fallback to customer)
  const customerEmail = session.customer_details?.email ?? null;
  const customerPhone = session.customer_details?.phone ?? null;
  const customerName = session.customer_details?.name ?? null;
  const shippingName = session.shipping_details?.name ?? customerName ?? null;
  const shippingAddress =
    session.shipping_details?.address ??
    session.customer_details?.address ??
    null;

  // Line items with expanded product metadata (for productId/variantId)
  const { data: lineItems } = await stripe.checkout.sessions.listLineItems(
    session.id,
    { expand: ["data.price.product"], limit: 100 }
  );

    console.log("[SHOP WH] items retrieved:", { count: lineItems.length });

  // Idempotent order upsert
  const order = await prisma.order.upsert({
    where: { stripeSessionId: session.id }, // requires @unique
    update: {}, // retries = no-op
    create: {
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent?.toString() ?? null,

      email: customerEmail,
      phone: customerPhone,
      name: shippingName || customerName || null,
      addressJson: shippingAddress ? JSON.stringify(shippingAddress) : null,

      subtotalCents: session.amount_subtotal ?? 0,
      totalCents: session.amount_total ?? 0,
      currency: (session.currency || "usd").toLowerCase(),

      items: {
        create: lineItems.map((li) => {
          const qty = li.quantity ?? 1;
          const perUnit = Math.round(
            (li.amount_subtotal ?? 0) / Math.max(1, qty)
          );
          const meta = li.price?.product?.metadata ?? {};
          return {
            productId: meta.productId || null,
            variantId: meta.variantId || null, // allow null = default
            title: li.description || li.price?.product?.name || "Item",
            qty,
            priceCents: perUnit,
          };
        }),
      },
    },
    include: { items: true },
  });

  console.log("[SHOP WH] order upsert ✓", {
    id: order.id,
    total: order.totalCents,
    items: order.items.length,
  });

  // If this was a retry, stop before inventory/emails/cart
  if (order.createdAt.getTime() !== order.updatedAt.getTime()) {
    console.log("[SHOP WH] deduped (already existed):", order.id);
    return NextResponse.json({
      ok: true,
      type: "shop",
      orderId: order.id,
      deduped: true,
    });
  }

  // Decrement inventory per line item
  for (const li of lineItems) {
    const meta = li.price?.product?.metadata ?? {};
    const productId = meta.productId;
    const rawVariantId = meta.variantId;
    const qty = li.quantity ?? 1;

    if (!productId) {
      console.warn("[SHOP WH] missing productId in metadata:", li.description);
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
    } catch {
      console.error("[SHOP WH] inventory tx failed:", {
        productId,
        variantId,
        qty,
      });
      // don’t throw; order already persisted
    }
  }

  // Notify (only on first create)
  let notificationSent = false;
  try {
    const html = generateOrderEmail({ order, items: order.items });
    const emailClient = createResendClient();
    await sendRequiredEmail(emailClient, {
      from: "Shop Alerts <no-reply@mabelspawfectpetservices.com>",
      to: ["therainbowniche@gmail.com", "danieltorres.dt@gmail.com"],
      subject: `🛍️ New Order #${order.id.slice(0, 8)} · ${(order.totalCents / 100).toFixed(2)} ${order.currency?.toUpperCase() || "USD"}`,
      html,
    });
    notificationSent = true;
  } catch {
    notificationSent = false;
  }
  console.log("[SHOP WH] notification:", { notificationSent });

  // Clear cart
  if (cartId) {
    try {
      await prisma.cartItem.deleteMany({ where: { cartId } });
    } catch (e) {
      console.error("[SHOP] cart clear failed:", e);
    }
  }

    console.log("[SHOP WH] ✅ order done:", order.id);
    return NextResponse.json({ ok: true, type: "shop", orderId: order.id });
  } catch (error) {
    const providerFailure = error instanceof Stripe.errors.StripeError;
    console.error(
      providerFailure
        ? "[SHOP WH] Payment provider request failed."
        : "[SHOP WH] Event processing failed."
    );
    return NextResponse.json(
      {
        error: providerFailure
          ? "Shop payment provider request failed."
          : "Shop webhook processing failed.",
      },
      { status: providerFailure ? 502 : 500 }
    );
  }
}

// Helpers
async function ensureVariantId(productId, rawVariantId) {
  if (rawVariantId && rawVariantId !== "") return rawVariantId;
  let v = await prisma.variant.findFirst({
    where: { productId, name: "Default" },
  });
  if (!v)
    v = await prisma.variant.create({ data: { productId, name: "Default" } });
  return v.id;
}
