// app/admin1313/employee-store/actions.js
"use server";

import { headers } from "next/headers";

async function getAppBase() {
  const headerStore = await headers();

  const host = headerStore.get("host");
  const protocol =
    headerStore.get("x-forwarded-proto") ||
    (host?.includes("localhost") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`.replace(/\/+$/, "");
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your employee cart is empty.");
  }

  return items.map((item, index) => {
    if (
      !item ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      !Number.isInteger(item.unitAmount) ||
      item.unitAmount <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error(`Invalid cart item at index ${index}.`);
    }

    return {
      productId: String(item.productId || ""),
      variantId: String(item.variantId || ""),
      name: item.name.trim(),
      slug: String(item.slug || ""),
      unitAmount: item.unitAmount,
      quantity: item.quantity,
    };
  });
}

export async function createEmployeeCheckoutAction({ cartId, items }) {
  if (!process.env.ADMIN_SECRET) {
    throw new Error("ADMIN_SECRET is not configured.");
  }

  if (!process.env.STRIPE_EMPLOYEE_PROMOTION_CODE) {
    throw new Error("STRIPE_EMPLOYEE_PROMOTION_CODE is not configured.");
  }

  if (!process.env.STRIPE_RATE_FREE) {
    throw new Error("STRIPE_RATE_FREE is not configured.");
  }

  if (!cartId) {
    throw new Error("The employee cart is missing an ID.");
  }

  const validatedItems = validateItems(items);
  const appBase = await getAppBase();

  const response = await fetch(`${appBase}/api/shop/checkout`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-key": process.env.ADMIN_SECRET,
    },
    cache: "no-store",
    body: JSON.stringify({
      cartId: String(cartId),
      items: validatedItems,
      employeeCheckout: true,
      successUrl: `${appBase}/success`,
      cancelUrl: `${appBase}/admin1313/employee-store`,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.url) {
    console.error("[employee checkout] Checkout creation failed:", data);

    throw new Error(
      data?.error || "Unable to create the employee checkout session."
    );
  }

  return {
    url: data.url,
  };
}
