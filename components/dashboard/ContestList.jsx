// components/admin/ContestList.jsx
"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ContestList({ slug }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/contest/${slug}/entries?includeDeleted=${showDeleted ? "1" : "0"}`,
        { cache: "no-store" }
      );
      const j = await res.json();
      setEntries(Array.isArray(j.entries) ? j.entries : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [slug, showDeleted]);

  const isUndoable = (e) => {
    if (!e.deletedAt) return false;
    const dt = new Date(e.deletedAt).getTime();
    return Date.now() - dt <= 15 * 60 * 1000; // 15 min
  };

  async function handleDelete(id) {
    if (!confirm("Delete this entry?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/contest/${slug}/entries/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Entry deleted (undo available for 15 minutes).");
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
      const res = await fetch(`/api/contest/${slug}/entries/${id}/undo`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Undo failed (maybe expired)");
      toast.success("Entry restored!");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Undo failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="opacity-70 text-sm">Loading entries…</p>;

  if (entries.length === 0)
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
        <p className="opacity-70 text-sm">No entries.</p>
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

      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {entries.map((e) => {
          const undoable = isUndoable(e);
          return (
            <li
              key={e.id}
              className={`card bg-base-200 ${e.deletedAt ? "opacity-60" : ""}`}
            >
              <figure className="aspect-square overflow-hidden">
                <img
                  src={
                    e.imageUrl ||
                    `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/image/upload/f_auto,q_auto/${e.publicId}`
                  }
                  alt={e.title}
                  className="w-full h-full object-cover"
                />
              </figure>
              <div className="card-body p-3">
                <div className="flex items-center justify-between">
                  <h3 className="card-title text-sm">{e.title}</h3>
                  {!e.deletedAt ? (
                    <button
                      className="btn btn-error btn-xs"
                      onClick={() => handleDelete(e.id)}
                      disabled={busyId === e.id}
                    >
                      {busyId === e.id ? "…" : "Delete"}
                    </button>
                  ) : undoable ? (
                    <button
                      className="btn btn-primary btn-xs"
                      onClick={() => handleUndo(e.id)}
                      disabled={busyId === e.id}
                    >
                      {busyId === e.id ? "…" : "Undo"}
                    </button>
                  ) : (
                    <span className="badge badge-outline badge-sm">
                      Deleted
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-70">
                  {e.votes} vote{e.votes === 1 ? "" : "s"}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
