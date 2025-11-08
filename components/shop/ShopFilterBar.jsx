// components/shop/ShopFilterBar.jsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const catSet = useMemo(() => new Set(selected || []), [selected]);

  const nameBySlug = useMemo(
    () => Object.fromEntries((categories || []).map((c) => [c.slug, c.name])),
    [categories]
  );

  const replaceURL = (nextCats = catSet, opts = {}) => {
    const params = new URLSearchParams(searchParams?.toString() || "");

    const cats = Array.from(nextCats);
    if (cats.length) params.set("c", cats.join(","));
    else params.delete("c");

    if (opts.stock === true) params.set("stock", "1");
    else if (opts.stock === false) params.delete("stock");

    if (typeof opts.q === "string") {
      const trimmed = opts.q.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
    }

    const url = params.toString() ? `${pathname}?${params}` : pathname;
    router.replace(url, { scroll: false });
  };

  // Debounce search input
  const debRef = useRef(null);
  useEffect(() => {
    if (text === (query || "")) return;
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => replaceURL(catSet, { q: text }), 300);
    return () => clearTimeout(debRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const toggleCat = (slug) => {
    const next = new Set(catSet);
    next.has(slug) ? next.delete(slug) : next.add(slug);
    replaceURL(next);
  };

  const clearAll = () => router.replace(pathname, { scroll: false });

  // Build active filters list
  const activeFilters = useMemo(() => {
    const list = [];
    (selected || []).forEach((slug) =>
      list.push({ type: "cat", slug, label: nameBySlug[slug] || slug })
    );
    if (inStockOnly) list.push({ type: "stock", label: "In stock only" });
    if ((query || "").trim())
      list.push({ type: "q", label: `“${query.trim()}”` });
    return list;
  }, [selected, inStockOnly, query, nameBySlug]);

  const removeFilter = (f) => {
    if (f.type === "cat") {
      const next = new Set(catSet);
      next.delete(f.slug);
      replaceURL(next);
    } else if (f.type === "stock") {
      replaceURL(catSet, { stock: false });
    } else if (f.type === "q") {
      setText("");
      replaceURL(catSet, { q: "" });
    }
  };

  const selectedCount = activeFilters.length;

  return (
    <div className="rounded-xl border bg-base-100 p-3 sm:p-4">
      {/* Row 1: search + stock + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0">
          <input
            className="input input-bordered w-full"
            placeholder="Search products…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && replaceURL(catSet, { q: text })
            }
            inputMode="search"
          />
        </div>

        <label className="inline-flex items-center gap-2 pl-0.5">
          <input
            id="in-stock"
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={!!inStockOnly}
            onChange={(e) => replaceURL(catSet, { stock: e.target.checked })}
          />
          <span className="text-sm">In stock only</span>
        </label>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => replaceURL(catSet, { q: text })}
          >
            Apply
          </button>
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>
            Clear
          </button>
        </div>
      </div>

      {/* Row 2: active filters (removable chips) */}
      {selectedCount > 0 && (
        <div className="mt-2 -mx-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 px-1 py-1">
            {activeFilters.map((f) => (
              <button
                key={`${f.type}:${f.slug || f.label}`}
                onClick={() => removeFilter(f)}
                className="badge bg-base-200 border-base-300 text-base-content/90 gap-1 px-3 py-3 whitespace-nowrap"
                title="Remove filter"
              >
                <span>{f.label}</span>
                <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ))}
            <button className="btn btn-ghost btn-xs ml-1" onClick={clearAll}>
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Row 3: category chips (mobile scrollable) */}
      <div className="mt-3 -mx-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 px-1 py-1">
          {categories.map((c) => {
            const active = catSet.has(c.slug);
            return (
              <button
                key={c.slug}
                onClick={() => toggleCat(c.slug)}
                className={[
                  "badge select-none whitespace-nowrap cursor-pointer",
                  "px-3 py-3 text-[12.5px] leading-none",
                  active
                    ? "badge-primary text-primary-content"
                    : "badge-outline",
                ].join(" ")}
                title={c.name}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 4: meta */}
      <div className="mt-2 flex items-center justify-between text-xs sm:text-sm text-base-content/70">
        <span>
          {selectedCount > 0
            ? `${selectedCount} filter${selectedCount > 1 ? "s" : ""} active`
            : "No filters active"}
        </span>
        {selected?.length || query || inStockOnly ? (
          <button className="link" onClick={clearAll}>
            Clear all
          </button>
        ) : null}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
