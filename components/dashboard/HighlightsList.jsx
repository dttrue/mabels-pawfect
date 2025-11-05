// components/dashboard/HighlightsList.jsx

"use client";
import { useEffect, useState } from "react";

export function HighlightsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/highlights", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || json?.error)
          throw new Error(json?.error || "Fetch failed");
        if (mounted) setRows(json?.highlights || []);
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p>Loading…</p>;
  if (err) return <p className="text-error">{err}</p>;
  if (!rows.length) return <p className="opacity-70">No highlights yet.</p>;

  return (
    <ul className="grid md:grid-cols-2 gap-4">
      {rows.map((h) => (
        <li key={h.id} className="p-3 border rounded-lg bg-base-100">
          <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-base-200">
            <video
              className="w-full h-full object-cover"
              controls
              playsInline
              poster={h.posterUrl || undefined}
            >
              <source src={h.url} type="video/mp4" />
            </video>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{h.title}</p>
              <p className="text-xs opacity-70">{h.slug}</p>
            </div>
            {/* Add delete/edit later if desired */}
          </div>
        </li>
      ))}
    </ul>
  );
}
