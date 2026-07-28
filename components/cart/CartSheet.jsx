// components/cart/CartSheet.jsx
"use client";

import { Fragment, useState } from "react";
import { usePathname } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { useCart } from "./CartContext";
import { createEmployeeCheckoutAction } from "@/app/admin/employee-store/actions";

function money(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((cents || 0) / 100);
}

function normalizeSlug(raw) {
  if (!raw) return "";

  return String(raw)
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getCartIdFromCookie() {
  const match = document.cookie.match(/(?:^|;\s*)cart_id=([^;]+)/);

  return match ? decodeURIComponent(match[1]) : null;
}

// The cart may display a sale price, but checkout receives the original
// price so the server can apply the active sale exactly once.
function buildItemsPayload(cart) {
  return (cart?.items || []).map((item) => {
    const product = item.product || {};
    const variant = item.variant || {};

    const name = product.title + (variant.name ? ` (${variant.name})` : "");

    const rawSlug =
      item.slug ||
      product.slug ||
      (typeof product.slug === "object" && product.slug.current) ||
      product.handle ||
      product.title ||
      name;

    const originalUnitAmount =
      typeof item.originalPriceCents === "number"
        ? item.originalPriceCents
        : item.priceCents;

    return {
      productId: item.productId || product.id || "",
      variantId: item.variantId || variant.id || "",
      name,
      slug: normalizeSlug(rawSlug),
      unitAmount: Math.round(originalUnitAmount || 0),
      quantity: Math.max(1, Math.floor(item.qty || 1)),
    };
  });
}

function CheckoutButton({ cart, cartIsEmpty, employeeCheckout }) {
  const [busy, setBusy] = useState(false);

  async function handleCheckout() {
    try {
      setBusy(true);

      const cartId = cart?.id || getCartIdFromCookie();
      const items = buildItemsPayload(cart);

      if (!cartId || items.length === 0) {
        alert("Your cart is empty or missing an ID.");
        setBusy(false);
        return;
      }

      if (employeeCheckout) {
        const result = await createEmployeeCheckoutAction({
          cartId,
          items,
        });

        if (!result?.url) {
          throw new Error("Employee checkout did not return a Stripe URL.");
        }

        window.location.href = result.url;
        return;
      }

      const payload = {
        cartId,
        items,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/shop`,
        employeeCheckout: false,
      };

      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("[checkout] client error:", error);

      alert(error?.message || "Checkout failed. Please try again.");

      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy || cartIsEmpty}
      onClick={handleCheckout}
      className="mt-3 inline-flex w-full items-center justify-center rounded bg-green-500 px-4 py-3 font-medium text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy
        ? "Redirecting..."
        : employeeCheckout
          ? "Employee Checkout"
          : "Checkout"}
    </button>
  );
}

export default function CartSheet() {
  const pathname = usePathname();

  const employeeCheckout =
    pathname?.startsWith("/admin1313/employee-store") ?? false;

  const { open, setOpen, cart, loading, updateQty, remove } = useCart();

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="flex w-screen max-w-md flex-col bg-white shadow-xl">
                <div className="flex items-center justify-between border-b p-4">
                  <Dialog.Title className="text-lg font-semibold">
                    {employeeCheckout ? "Employee Cart" : "Your Cart"}
                  </Dialog.Title>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100"
                    aria-label="Close cart"
                  >
                    ×
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <div className="py-10 text-center">Loading...</div>
                  ) : cart?.items?.length ? (
                    <div className="space-y-4">
                      {cart.items.map((item) => {
                        const isSummerSale = Boolean(item.isSummerSale);

                        const originalPriceCents =
                          typeof item.originalPriceCents === "number"
                            ? item.originalPriceCents
                            : item.priceCents;

                        const salePriceCents =
                          typeof item.salePriceCents === "number"
                            ? item.salePriceCents
                            : isSummerSale
                              ? item.priceCents
                              : null;

                        return (
                          <div key={item.id} className="flex gap-3">
                            <img
                              src={item.product?.imageUrl || "/placeholder.png"}
                              alt={item.product?.title || "Cart item"}
                              className="h-16 w-16 rounded bg-gray-100 object-cover"
                            />

                            <div className="flex-1">
                              <div className="font-medium">
                                {item.product?.title}
                              </div>

                              {item.variant?.name && (
                                <div className="text-xs opacity-70">
                                  {item.variant.name}
                                </div>
                              )}

                              <div className="text-sm">
                                {isSummerSale && salePriceCents !== null ? (
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xs text-gray-400 line-through">
                                      {money(originalPriceCents)}
                                    </span>

                                    <span className="font-medium text-green-700">
                                      {money(salePriceCents)}
                                    </span>
                                  </div>
                                ) : (
                                  <span>{money(item.priceCents)}</span>
                                )}
                              </div>

                              {isSummerSale && (
                                <div className="mt-0.5 text-[11px] font-medium text-green-700">
                                  Summer sale
                                </div>
                              )}

                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  className="rounded bg-gray-100 px-2 py-1"
                                  onClick={() =>
                                    updateQty(
                                      item.id,
                                      Math.max(1, item.qty - 1)
                                    )
                                  }
                                  aria-label={`Decrease quantity for ${
                                    item.product?.title || "cart item"
                                  }`}
                                >
                                  −
                                </button>

                                <span className="min-w-6 text-center">
                                  {item.qty}
                                </span>

                                <button
                                  type="button"
                                  className="rounded bg-gray-100 px-2 py-1"
                                  onClick={() =>
                                    updateQty(item.id, item.qty + 1)
                                  }
                                  aria-label={`Increase quantity for ${
                                    item.product?.title || "cart item"
                                  }`}
                                >
                                  +
                                </button>

                                <button
                                  type="button"
                                  className="ml-2 text-sm text-red-600"
                                  onClick={() => remove(item.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center opacity-70">
                      Your cart is empty.
                    </div>
                  )}
                </div>

                <div className="border-t p-4">
                  {(() => {
                    const subtotal = cart?.totals?.subtotalCents ?? 0;

                    const discount = cart?.totals?.discountCents ?? 0;

                    const total =
                      cart?.totals?.totalCents ??
                      Math.max(0, subtotal - discount);

                    return (
                      <>
                        <div className="flex justify-between text-base font-semibold">
                          <span>Subtotal</span>
                          <span>{money(subtotal)}</span>
                        </div>

                        {discount > 0 && !employeeCheckout && (
                          <div className="mt-1 flex justify-between text-sm text-green-700">
                            <span>Summer sale discount</span>
                            <span>-{money(discount)}</span>
                          </div>
                        )}

                        {employeeCheckout && (
                          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                            Your 50% employee discount and free shipping will be
                            applied automatically at checkout.
                          </div>
                        )}

                        <div className="mt-3 flex justify-between border-t pt-3 text-base font-semibold">
                          <span>
                            {employeeCheckout ? "Current subtotal" : "Total"}
                          </span>

                          <span>{money(total)}</span>
                        </div>

                        <p className="mt-1 text-xs opacity-70">
                          {employeeCheckout
                            ? "Employee pricing, taxes, and shipping will be finalized at checkout."
                            : "Taxes and shipping are calculated at checkout."}
                        </p>

                        <CheckoutButton
                          cart={cart}
                          cartIsEmpty={!cart?.items?.length}
                          employeeCheckout={employeeCheckout}
                        />
                      </>
                    );
                  })()}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
