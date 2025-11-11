"use client";
import { useEffect, useRef, useState } from "react";

function fmt(cents = 0, currency = "USD") {
  if (typeof cents !== "number") return "-";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency });
}

function safeJSON(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function parseAddress(order) {
  const a =
    order?.address ??
    (typeof order?.addressJson === "string"
      ? safeJSON(order.addressJson)
      : null);
  if (!a) return "";
  return [
    a.line1,
    a.line2,
    `${a.city ?? ""} ${a.state ?? ""}`.trim(),
    a.postal_code,
    a.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function OrderPanel({ sessionId = "", initialOrder = null }) {
  const [order, setOrder] = useState(initialOrder);
  const [tries, setTries] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (order || !sessionId) return;
    let cancelled = false;

    async function fetchOnce() {
      try {
        const r = await fetch(
          `/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );
        if (r.ok) {
          const json = await r.json();
          const next = json?.order ?? json ?? null; // <-- unwrap here
          if (!cancelled && next) {
            setOrder(next);
            return;
          }
        }
      } catch {}
      if (!cancelled && tries < 12) {
        timer.current = setTimeout(() => setTries((t) => t + 1), 1000);
      }
    }

    fetchOnce();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, tries, !!order]);

  if (!sessionId) {
    return (
      <div className="alert alert-warning">
        Missing session id. If you paid, your order is safe—please contact
        support.
      </div>
    );
  }
  if (!order) {
    return (
      <div className="alert alert-info">
        We’re finalizing your order. This will update automatically.
      </div>
    );
  }

  const shortId = order.id ? String(order.id).slice(0, 8) : "";
  const currency = (order.currency || "USD").toUpperCase();
  const items = Array.isArray(order.items) ? order.items : [];
  const shipTo = parseAddress(order);

  return (
    <>
      <section className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Order {shortId ? `#${shortId}` : ""}</h2>
          <div className="text-sm opacity-80 space-y-1">
            <div>
              <b>Name:</b> {order.name ?? "—"}
            </div>
            <div>
              <b>Email:</b> {order.email ?? "—"}
            </div>
            <div>
              <b>Phone:</b> {order.phone ?? "—"}
            </div>
            {shipTo && (
              <div className="mt-2">
                <b>Ship to:</b> {shipTo}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="card bg-base-100 shadow mt-6">
        <div className="card-body">
          <h3 className="card-title">Items</h3>
          {items.length ? (
            <>
              <ul className="divide-y">
                {items.map((it) => {
                  const lineTotal =
                    (Number(it?.priceCents) || 0) * (Number(it?.qty) || 0);
                  return (
                    <li
                      key={it.id ?? `${it.title}-${it.qty}`}
                      className="py-2 flex justify-between"
                    >
                      <span>
                        {it?.title ?? "Item"}{" "}
                        <span className="opacity-60">× {it?.qty ?? 0}</span>
                      </span>
                      <span>{fmt(lineTotal, currency)}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex justify-end text-lg font-semibold">
                Total: {fmt(Number(order.totalCents) || 0, currency)}
              </div>
            </>
          ) : (
            <div className="opacity-70">No line items found.</div>
          )}
        </div>
      </section>
    </>
  );
}
