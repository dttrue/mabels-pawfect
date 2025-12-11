// components/dashboard/SiteImageList.jsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SiteImageList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/site-images", {
        cache: "no-store",
      });
      const j = await res.json().catch(() => ({}));
      setItems(Array.isArray(j.images) ? j.images : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load site images");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function imgSrc(it) {
    // Prefer explicit URL field
    const direct = it.imageUrl || it.url;
    if (direct) return direct;

    // Fallback to building from publicId
    if (!it.publicId || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD) return "";
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/image/upload/f_auto,q_auto/${it.publicId}`;
  }

  async function handleDelete(id, key) {
    if (
      !confirm(
        `Delete site image "${key}"? This removes the DB record (not the Cloudinary asset).`
      )
    )
      return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/site-images/${id}`, {
        method: "DELETE",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Delete failed");

      toast.success("Site image deleted");
      await load();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="opacity-70 text-sm">Loading site images…</p>;
  }

  if (!items.length) {
    return (
      <div className="flex items-center justify-between">
        <p className="opacity-70 text-sm">No site images saved yet.</p>
        <button className="btn btn-ghost btn-xs" onClick={load}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          Site Images (hero, logo, flyers, etc.)
        </h3>
        <button className="btn btn-ghost btn-xs" onClick={load}>
          Refresh
        </button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((it) => {
          const src = imgSrc(it);
          const isBusy = busyId === it.id;

          return (
            <li
              key={it.id}
              className="card bg-base-200 border border-base-300/60"
            >
              <figure className="aspect-square overflow-hidden">
                {src ? (
                  <img
                    src={src}
                    alt={it.alt || it.caption || it.key || "Site image"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs opacity-60">
                    No preview
                  </div>
                )}
              </figure>

              <div className="card-body p-3 gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {/* stable key */}
                    <p className="text-[11px] font-mono uppercase tracking-wide text-primary/80 truncate">
                      {it.key}
                    </p>

                    <h3 className="card-title text-sm truncate">
                      {it.caption || "No caption"}
                    </h3>

                    <p className="text-xs opacity-70 line-clamp-2">
                      {it.alt || "No alt text"}
                    </p>

                    {it.keywords?.length ? (
                      <p className="mt-1 text-[11px] opacity-70 line-clamp-1">
                        {it.keywords.join(", ")}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      className="btn btn-error btn-xs"
                      onClick={() => handleDelete(it.id, it.key)}
                      disabled={isBusy}
                    >
                      {isBusy ? "…" : "Delete"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] opacity-60">
                  <span>ID: {it.id.slice(0, 8)}…</span>
                  <span>
                    {new Date(it.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
