// app/admin/inventory/InventoryAdminPanelList.jsx
"use client";

import { useEffect, useMemo, useState } from "react";

export default function InventoryAdminPanelList({
  className = "",
  onReload, // optional callback after any write
  showActions = true, // hide actions to make this view-only
}) {
  const { items, loading, reload } = useProducts();

  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      items.filter((p) =>
        (p.title + " " + p.slug).toLowerCase().includes(q.toLowerCase())
      ),
    [items, q]
  );

  async function setQty(productId, variantId, onHand, reason) {
    await fetchJson("/api/admin/inventory/upsert", {
      productId,
      variantId,
      onHand,
      reason,
    });
    await reloadBoth();
  }

  async function adjust(productId, variantId, delta, reason) {
    await fetchJson("/api/admin/inventory/adjust", {
      productId,
      variantId,
      delta,
      reason,
    });
    await reloadBoth();
  }

  async function removeRow(productId, variantId, reason) {
    await fetchJson("/api/admin/inventory/delete", {
      productId,
      variantId,
      reason,
    });
    await reloadBoth();
  }

  async function reloadBoth() {
    await reload();
    if (typeof onReload === "function") onReload();
  }

  

  return (
    <section className={className}>
      <div className="mb-3 flex gap-2">
        <input
          className="input input-bordered w-full"
          placeholder="Search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn" onClick={reload}>
          Refresh
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <EmptyState query={q} />
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <ProductBlock
              key={p.id}
              product={p}
              showActions={showActions}
              onSet={setQty}
              onAdjust={adjust}
              onDelete={removeRow}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* -------------------- hooks & utils -------------------- */

function useProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory/list", {
        cache: "no-store",
      });
      const json = await res.json();
      setItems(json.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { items, loading, reload: load, setItems };
}

async function fetchJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(`${url} failed: ${res.status} ${msg}`);
  }
  return res.json();
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

/* -------------------- UI blocks -------------------- */

function ProductBlock({ product, showActions, onSet, onAdjust, onDelete }) {
  async function addDefaultVariant() {
    const res = await fetch("/api/admin/variants/create-default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    if (!res.ok) {
      alert("Failed to create Default variant");
      return;
    }
    // naive: refresh the page list
    window.location.reload();
  }

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-2">
        <div className="font-semibold">{product.title}</div>
        <div className="ml-auto text-xs opacity-60">{product.slug}</div>
      </div>

      {product.variants?.length ? (
        <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {product.variants.map((v) => (
            <VariantRow
              key={v.id}
              label={v.name}
              qty={v.onHand}
              disabled={!showActions}
              onSet={(n, r) => onSet(product.id, v.id, n, r)}
              onAdjust={(d, r) => onAdjust(product.id, v.id, d, r)}
              onDelete={(r) => onDelete(product.id, v.id, r)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <div className="text-sm opacity-70">
            No variants found. Add a “Default” variant to manage stock.
          </div>
          {showActions && (
            <button className="btn btn-sm" onClick={addDefaultVariant}>
              + Add Default Variant
            </button>
          )}
        </div>
      )}
    </div>
  );
}


function VariantRow({ label, qty, onSet, onAdjust, onDelete, disabled }) {
  const [val, setVal] = useState(qty);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setVal(qty);
  }, [qty]);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
      <div className="badge">{label}</div>

      <input
        type="number"
        min={0}
        className="input input-bordered w-24"
        value={val}
        onChange={(e) => setVal(parseInt(e.target.value || "0", 10))}
        disabled={disabled}
      />

      <button
        className="btn btn-sm"
        onClick={() => onSet(val, reason)}
        disabled={disabled}
      >
        Set
      </button>
      <button
        className="btn btn-sm"
        onClick={() => onAdjust(+1, reason)}
        disabled={disabled}
      >
        +1
      </button>
      <button
        className="btn btn-sm"
        onClick={() => onAdjust(-1, reason)}
        disabled={disabled || qty <= 0}
      >
        -1
      </button>

      <button
        className="btn btn-sm btn-outline"
        onClick={() => onDelete(reason)}
        disabled={disabled}
      >
        Delete Row
      </button>

      <input
        className="input input-bordered flex-1 min-w-[200px]"
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={disabled}
      />

      <div
        className={`ml-auto text-sm ${qty <= 0 ? "text-error" : "opacity-60"}`}
      >
        Current: {qty}
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse h-20 bg-base-200 rounded" />
      ))}
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div className="text-center py-10 border rounded-lg">
      <div className="text-lg font-medium">No products found</div>
      {query ? <div className="opacity-60 mt-1">Query: “{query}”</div> : null}
    </div>
  );
}
