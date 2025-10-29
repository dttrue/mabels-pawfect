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

function CheckoutButton({ cartIsEmpty }) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      disabled={busy || cartIsEmpty}
      onClick={async () => {
        try {
          setBusy(true);
          const res = await fetch("/api/shop/checkout", {
            method: "POST",
            cache: "no-store",
          });
          const data = await res.json();
          if (res.ok && data?.url) {
            window.location.href = data.url;
          } else {
            alert(data?.error || "Checkout failed");
            setBusy(false);
          }
        } catch (e) {
          alert("Checkout failed");
          setBusy(false);
        }
      }}
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
                  <div className="flex justify-between text-base font-semibold">
                    <span>Subtotal</span>
                    <span>{money(cart.totals?.subtotalCents || 0)}</span>
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    Taxes & shipping calculated at checkout.
                  </p>

                  {/* Checkout button */}
                  <CheckoutButton cartIsEmpty={!cart.items?.length} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
