"use client";
import { useEffect, useState } from "react";

function fmt(cents, currency = "USD") {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency });
}

export default function OrderPanel({ sessionId, initialOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [tries, setTries] = useState(0);

  // Poll until the webhook writes the order (max ~12s)
  useEffect(() => {
    if (order || !sessionId) return;

    let cancelled = false;
    async function tick() {
      try {
        const r = await fetch(
          `/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );
        if (r.ok) {
          const json = await r.json();
          if (!cancelled) setOrder(json);
          return;
        }
      } catch {}
      if (!cancelled && tries < 12) {
        setTimeout(tick, 1000);
        setTries((t) => t + 1);
      }
    }
    tick();
    return () => {
      cancelled = true;
    };
  }, [order, sessionId, tries]);

  if (!order) {
    return (
      <div className="alert alert-info">
        <span>
          We’re finalizing your order. This will update automatically.
        </span>
      </div>
    );
  }

  return (
    <>
      <section className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Order #{order.id.slice(0, 8)}</h2>
          <div className="text-sm opacity-80">
            <div>
              <b>Name:</b> {order.name ?? "—"}
            </div>
            <div>
              <b>Email:</b> {order.email ?? "—"}
            </div>
            <div>
              <b>Phone:</b> {order.phone ?? "—"}
            </div>
            {order.address && (
              <div className="mt-2">
                <b>Ship to:</b>{" "}
                {[
                  order.address.line1,
                  order.address.line2,
                  `${order.address.city ?? ""} ${order.address.state ?? ""}`.trim(),
                  order.address.postal_code,
                  order.address.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="card bg-base-100 shadow mt-6">
        <div className="card-body">
          <h3 className="card-title">Items</h3>
          <ul className="divide-y">
            {order.items.map((it) => (
              <li key={it.id} className="py-2 flex justify-between">
                <span>
                  {it.title} <span className="opacity-60">× {it.qty}</span>
                </span>
                <span>{fmt(it.priceCents * it.qty, order.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end text-lg font-semibold">
            Total: {fmt(order.totalCents, order.currency)}
          </div>
        </div>
      </section>
    </>
  );
}
