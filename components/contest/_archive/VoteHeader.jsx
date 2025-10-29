// components/contest/VoteHeader.jsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function VoteHeader({
  slug,
  refreshing,
  onRefresh,
  lastUpdated,
}) {
  const [now, setNow] = useState(Date.now());

  const title = useMemo(
    () =>
      (slug || "")
        .replaceAll("-", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    [slug]
  );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ago = useMemo(() => {
    if (!lastUpdated) return "never";
    const s = Math.max(0, Math.floor((now - Number(lastUpdated)) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s ago`;
  }, [lastUpdated, now]);

  return (
    <div className="sticky top-0 z-20 bg-base-100/90 backdrop-blur border-b">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <Link href={`/contest/${slug}`} className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h1 className="text-lg font-semibold flex-1 truncate">Vote: {title}</h1>
        <div className="text-xs opacity-70">Updated {ago}</div>
        <button
          className={`btn btn-sm ${refreshing ? "btn-disabled" : "btn-outline"}`}
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}
