// components/cart/CartSheet.jsx
"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useCart } from "./CartContext";

function money(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

// ✅ Normalize slug so it matches backend/config slugs
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

// ✅ Helper to read cart_id cookie (fallback)
function getCartIdFromCookie() {
  const m = document.cookie.match(/(?:^|;\s*)cart_id=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// ✅ Helper to build items payload safely (with SLUG)
function buildItemsPayload(cart) {
  return (cart?.items || []).map((it) => {
    const product = it.product || {};
    const variant = it.variant || {};

    const name = product.title + (variant.name ? ` (${variant.name})` : "");

    // Try several sources for slug, then normalize
    const rawSlug =
      it.slug ||
      product.slug ||
      (typeof product.slug === "object" && product.slug.current) ||
      product.handle ||
      product.title ||
      name;

    const slug = normalizeSlug(rawSlug);

    return {
      productId: it.productId || product.id || "",
      variantId: it.variantId || variant.id || "",
      name,
      slug, // 🔥 used by buildLineItemsWithBogo50 on the server
      unitAmount: Math.round(it.priceCents || 0),
      quantity: Math.max(1, Math.floor(it.qty || 1)),
    };
  });
}

// ✅ Updated CheckoutButton
function CheckoutButton({ cart, cartIsEmpty }) {
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

      const payload = {
        cartId,
        items,
        successUrl: `${location.origin}/success`,
        cancelUrl: `${location.origin}/shop`,
      };

      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.url) {
        window.location.href = data.url;
      } else {
        alert(data?.error || "Checkout failed");
        setBusy(false);
      }
    } catch (e) {
      console.error("[checkout] client error:", e);
      alert("Checkout failed");
      setBusy(false);
    }
  }

  return (
    <button
      disabled={busy || cartIsEmpty}
      onClick={handleCheckout}
      className="mt-3 inline-flex w-full items-center justify-center rounded bg-orange-500 px-4 py-3 font-medium text-white disabled:opacity-60 active:scale-[0.99] transition"
    >
      {busy ? "Redirecting…" : "Checkout"}
    </button>
  );
}

export default function CartSheet() {
  const { open, setOpen, cart, loading, updateQty, remove } = useCart();

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setOpen(false)}>
        {/* Backdrop */}
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

        {/* Panel */}
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
              <Dialog.Panel className="w-screen max-w-md bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <Dialog.Title className="text-lg font-semibold">
                    Your Cart
                  </Dialog.Title>
                  <button
                    onClick={() => setOpen(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100"
                    aria-label="Close cart"
                  >
                    ✕
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <div className="py-10 text-center">Loading…</div>
                  ) : cart.items?.length ? (
                    <div className="space-y-4">
                      {cart.items.map((it) => (
                        <div key={it.id} className="flex gap-3">
                          <img
                            src={it.product.imageUrl || "/placeholder.png"}
                            alt={it.product.title}
                            className="w-16 h-16 rounded object-cover bg-gray-100"
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {it.product.title}
                            </div>
                            {it.variant?.name && (
                              <div className="text-xs opacity-70">
                                {it.variant.name}
                              </div>
                            )}
                            <div className="text-sm">
                              {money(it.priceCents)}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                className="px-2 py-1 rounded bg-gray-100"
                                onClick={() =>
                                  updateQty(it.id, Math.max(1, it.qty - 1))
                                }
                              >
                                −
                              </button>
                              <span className="min-w-6 text-center">
                                {it.qty}
                              </span>
                              <button
                                className="px-2 py-1 rounded bg-gray-100"
                                onClick={() => updateQty(it.id, it.qty + 1)}
                              >
                                +
                              </button>
                              <button
                                className="ml-2 text-red-600 text-sm"
                                onClick={() => remove(it.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center opacity-70">
                      Your cart is empty.
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t p-4">
                  {(() => {
                    const subtotal = cart.totals?.subtotalCents ?? 0;
                    const discount = cart.totals?.discountCents ?? 0;
                    const total =
                      cart.totals?.totalCents ??
                      Math.max(0, subtotal - discount);

                    return (
                      <>
                        <div className="flex justify-between text-base font-semibold">
                          <span>Subtotal</span>
                          <span>{money(subtotal)}</span>
                        </div>

                        {discount > 0 && (
                          <div className="mt-1 flex justify-between text-sm text-green-700">
                            <span>Black Friday savings</span>
                            <span>-{money(discount)}</span>
                          </div>
                        )}

                        <div className="mt-2 flex justify-between text-base font-semibold border-t pt-2">
                          <span>Total</span>
                          <span>{money(total)}</span>
                        </div>

                        <p className="text-xs opacity-70 mt-1">
                          Taxes &amp; shipping calculated at checkout.
                        </p>

                        {/* ✅ Checkout button */}
                        <CheckoutButton
                          cart={cart}
                          cartIsEmpty={!cart.items?.length}
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
