// components/shop/ShopFilterBar.jsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function ShopFilterBar({
  categories,
  selected,
  query,
  inStockOnly,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [text, setText] = useState(query || "");

  const catMap = useMemo(() => new Set(selected || []), [selected]);

  function updateURL(nextSelected = catMap, opts = {}) {
    const params = new URLSearchParams(searchParams?.toString() || "");

    // categories as comma list
    const cats = Array.from(nextSelected);
    if (cats.length) params.set("c", cats.join(","));
    else params.delete("c");

    // stock flag
    if (opts.stock === true) params.set("stock", "1");
    else if (opts.stock === false) params.delete("stock");

    // query
    if (typeof opts.q === "string") {
      const trimmed = opts.q.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggleCat(slug) {
    const next = new Set(catMap);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    updateURL(next);
  }

  function clearAll() {
    router.push(pathname, { scroll: false });
  }

  return (
    <div className="rounded-xl border p-3 sm:p-4 bg-base-100">
      {/* Top row: search + stock */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="input input-bordered w-full sm:w-80"
          placeholder="Search products…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateURL(catMap, { q: text })}
        />
        <div className="flex items-center gap-2">
          <input
            id="in-stock"
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={!!inStockOnly}
            onChange={(e) => updateURL(catMap, { stock: e.target.checked })}
          />
          <label htmlFor="in-stock" className="text-sm">
            In stock only
          </label>
        </div>
        <div className="flex-1" />
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => updateURL(catMap, { q: text })}
        >
          Apply
        </button>
        <button className="btn btn-ghost btn-sm" onClick={clearAll}>
          Clear
        </button>
      </div>

      {/* Categories row */}
      <div className="mt-3 flex flex-wrap gap-2">
        {categories.map((c) => {
          const active = catMap.has(c.slug);
          return (
            <button
              key={c.slug}
              onClick={() => toggleCat(c.slug)}
              className={`badge cursor-pointer ${active ? "" : "badge-outline"}`}
              title={c.slug}
            >
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
