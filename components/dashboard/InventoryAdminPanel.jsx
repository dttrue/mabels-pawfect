// components/dashboard/InventoryAdminPanel.jsx
"use client";

import { useEffect, useMemo, useState } from "react";

export default function InventoryAdminPanel() {
  const [tab, setTab] = useState("stock"); // "stock" | "variants" | "bulk" | "audit"
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Inventory Admin</h1>

      <div role="tablist" className="tabs tabs-boxed mb-4">
        {["stock", "variants", "bulk", "audit"].map((t) => (
          <a
            key={t}
            role="tab"
            className={`tab ${tab === t ? "tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </a>
        ))}
      </div>

      {tab === "stock" && <StockTab />}
      {tab === "variants" && <VariantsTab />}
      {tab === "bulk" && <BulkTab />}
      {tab === "audit" && <AuditTab />}
    </main>
  );
}

/* ---------------------------------- hooks --------------------------------- */

function useProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/inventory/list", { cache: "no-store" });
    const json = await res.json();
    setItems(json.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return { items, loading, reload: load };
}

/* --------------------------------- STOCK ---------------------------------- */

function StockTab() {
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
    const safe = Number.isFinite(onHand) && onHand >= 0 ? onHand : 0;
    const res = await fetch("/api/admin/inventory/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId, onHand: safe, reason }),
    });
    if (!res.ok) alert("Set quantity failed");
    await reload();
  }

  async function adjust(productId, variantId, delta, reason) {
    const res = await fetch("/api/admin/inventory/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId, delta, reason }),
    });
    if (!res.ok) alert("Adjust failed");
    await reload();
  }

  async function removeRow(productId, variantId, reason) {
    const res = await fetch("/api/admin/inventory/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId, reason }),
    });
    if (!res.ok) alert("Delete row failed");
    await reload();
  }

  if (loading) return <div>Loading…</div>;

  return (
    <>
      <div className="mb-3">
        <input
          className="input input-bordered w-full"
          placeholder="Search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map((p) => (
          <div key={p.id} className="border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="font-semibold">{p.title}</div>
              <div className="ml-auto text-xs opacity-60">{p.slug}</div>
            </div>

            {p.variants.length ? (
              <>
                <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {p.variants.map((v) => (
                    <VariantRow
                      key={v.id}
                      label={v.name}
                      qty={v.onHand}
                      productId={p.id}
                      variantId={v.id}
                      onSet={(n, r) => setQty(p.id, v.id, n, r)}
                      onAdjust={(d, r) => adjust(p.id, v.id, d, r)}
                      onDelete={(r) => removeRow(p.id, v.id, r)}
                      onReload={reload}
                    />
                  ))}
                </div>

                {/* inline: add another variant */}
                <AddVariantInline productId={p.id} onAdded={reload} />
              </>
            ) : (
              <NoVariantsBlock productId={p.id} onReload={reload} />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* --------------------------- inline add-variant ---------------------------- */

function AddVariantInline({ productId, onAdded }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const label = name.trim();
    if (!label) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/variants/create-default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name: label }),
      });
      if (!res.ok) throw new Error(await res.text());
      setName("");
      onAdded?.();
    } catch (e) {
      alert("Failed to add variant: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        className="input input-bordered w-48"
        placeholder="Add variant (e.g., Pink)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={busy}
      />
      <button
        className="btn btn-sm"
        onClick={add}
        disabled={busy || !name.trim()}
      >
        + Add Variant
      </button>
    </div>
  );
}

/* ------------------------------ variant row ------------------------------- */

function VariantRow({
  label,
  qty = 0,
  onSet,
  onAdjust,
  onDelete,
  productId,
  variantId,
  onReload,
}) {
  const [val, setVal] = useState(qty);
  const [reason, setReason] = useState("");
  const canDec = Number.isFinite(val) && val > 0;

  async function doSet() {
    await onSet(val, reason);
  }

  async function deleteVariant() {
    if (
      !confirm(`Delete variant "${label}"? This also clears inventory & carts.`)
    )
      return;
    const res = await fetch("/api/admin/variants/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId, reason }),
    });
    if (!res.ok) {
      alert("Failed to delete variant");
      return;
    }
    await onReload?.();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
      <div className="badge">{label}</div>

      <input
        type="number"
        className="input input-bordered w-24"
        min={0}
        value={val}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          setVal(Number.isFinite(n) && n >= 0 ? n : 0);
        }}
      />
      <button className="btn btn-sm" onClick={doSet}>
        Set
      </button>
      <button className="btn btn-sm" onClick={() => onAdjust(+1, reason)}>
        +1
      </button>
      <button
        className="btn btn-sm"
        onClick={() => onAdjust(-1, reason)}
        disabled={!canDec}
      >
        -1
      </button>

      {/* delete inventory row only */}
      <button
        className="btn btn-sm btn-outline"
        onClick={() => onDelete(reason)}
      >
        Delete Row
      </button>

      {/* delete the variant entity */}
      <button className="btn btn-sm btn-error" onClick={deleteVariant}>
        Delete Variant
      </button>

      <input
        className="input input-bordered flex-1 min-w-[200px]"
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div
        className={`ml-auto text-sm ${qty <= 0 ? "text-error" : "opacity-60"}`}
      >
        Current: {qty}
      </div>
    </div>
  );
}

/* ------------------------------ no variants ------------------------------- */

function NoVariantsBlock({ productId, onReload }) {
  async function addDefaultVariant() {
    const res = await fetch("/api/admin/variants/create-default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) {
      alert("Failed to create Default variant");
      return;
    }
    await onReload?.();
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <div className="text-sm opacity-70">
        No variants found. Add a “Default” variant to manage stock.
      </div>
      <button className="btn btn-sm" onClick={addDefaultVariant}>
        + Add Default Variant
      </button>
    </div>
  );
}

/* -------------------------- placeholder other tabs ------------------------ */

function VariantsTab() {
  return (
    <div className="opacity-70">
      Variant CRUD UI (create/edit/delete, toggle active, price override) —
      happy to wire this next.
    </div>
  );
}

function BulkTab() {
  return (
    <div className="space-y-2">
      <p className="opacity-80">
        Upload CSV with columns:
        <code className="ml-1">productId, variantId, onHand, reason?</code>
      </p>
      <p className="opacity-60">
        You can also support productSlug/variantName mapping server-side if
        that’s easier.
      </p>
    </div>
  );
}

function AuditTab() {
  return (
    <div className="opacity-70">
      Audit viewer (InventoryLog) with filters — easy to add when you’re ready.
    </div>
  );
}
