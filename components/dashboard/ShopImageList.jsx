// components/dashboard/ShopImageList.jsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ShopImageList({ productId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (productId) p.set("productId", productId);
      p.set("includeDeleted", showDeleted ? "1" : "0");

      const res = await fetch(`/api/admin/shop/images?${p.toString()}`, {
        cache: "no-store",
      });
      const j = await res.json().catch(() => ({}));
      setItems(Array.isArray(j.images) ? j.images : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, showDeleted]);

  const isUndoable = (it) => {
    if (!it.deletedAt) return false;
    const dt = new Date(it.deletedAt).getTime();
    return Date.now() - dt <= 15 * 60 * 1000; // 15 min
  };

  async function handleDelete(id) {
    if (!confirm("Delete this image?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/shop/images/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Image deleted (undo available for 15 minutes).");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUndo(id) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/shop/images/${id}/undo`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Undo failed (maybe expired)");
      toast.success("Image restored!");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Undo failed");
    } finally {
      setBusyId(null);
    }
  }

  // ⭐ NEW: set as main image → PATCH { setMain: true }
  async function handleSetMain(id) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/shop/images/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setMain: true }),
      });
      if (!res.ok) throw new Error("Failed to set main image");
      toast.success("Set as main image");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to set main image");
    } finally {
      setBusyId(null);
    }
  }

  function imgSrc(it) {
    // Prefer explicit url field; fall back to imageUrl if API used that alias
    const direct = it.url || it.imageUrl;
    if (direct) return direct;

    // Fallback to building from publicId
    if (!it.publicId || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD) return "";
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/image/upload/f_auto,q_auto/${it.publicId}`;
  }

  if (loading) return <p className="opacity-70 text-sm">Loading images…</p>;

  if (items.length === 0)
    return (
      <div className="flex items-center gap-3">
        <label className="label cursor-pointer">
          <span className="label-text">Show deleted</span>
          <input
            type="checkbox"
            className="toggle toggle-sm ml-2"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />
        </label>
        <p className="opacity-70 text-sm">No images.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="label cursor-pointer">
          <span className="label-text">Show deleted</span>
          <input
            type="checkbox"
            className="toggle toggle-sm ml-2"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />
        </label>
        <button className="btn btn-ghost btn-xs" onClick={load}>
          Refresh
        </button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((it) => {
          const undoable = isUndoable(it);
          const isDeleted = !!it.deletedAt;
          const isBusy = busyId === it.id;
          const src = imgSrc(it);

          return (
            <li
              key={it.id}
              className={`card bg-base-200 ${isDeleted ? "opacity-60" : ""}`}
            >
              <figure className="aspect-square overflow-hidden">
                {src ? (
                  <img
                    src={src}
                    alt={it.alt || it.caption || it.publicId}
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
                    <h3 className="card-title text-sm truncate">
                      {it.caption || "Untitled image"}
                    </h3>
                    <p className="text-xs opacity-70 truncate">
                      {it.alt || "No alt text"}
                    </p>
                    <p className="text-[11px] opacity-60 mt-1">
                      sort: {typeof it.sort === "number" ? it.sort : "—"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-1">
                    {!isDeleted && (
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => handleSetMain(it.id)}
                        disabled={isBusy}
                      >
                        {isBusy ? "…" : "Set main"}
                      </button>
                    )}

                    {!isDeleted ? (
                      <button
                        className="btn btn-error btn-xs"
                        onClick={() => handleDelete(it.id)}
                        disabled={isBusy}
                      >
                        {isBusy ? "…" : "Delete"}
                      </button>
                    ) : undoable ? (
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => handleUndo(it.id)}
                        disabled={isBusy}
                      >
                        {isBusy ? "…" : "Undo"}
                      </button>
                    ) : (
                      <span className="badge badge-outline badge-sm">
                        Deleted
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs opacity-70">
                  <span className="truncate">ID: {it.id.slice(0, 8)}…</span>
                  {it.keywords?.length ? (
                    <span className="truncate">
                      {it.keywords.join?.(", ") || it.keywords}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
