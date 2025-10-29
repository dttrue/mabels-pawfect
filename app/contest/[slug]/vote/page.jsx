// app/contest/[slug]/vote/page.jsx
"use client";

import { use, useEffect, useRef, useState } from "react";
import { cldUrl } from "@/utils/cldUrl";

export default function VotePage({ params }) {
  // unwrap params in client components
  const { slug } = use(params);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false); // <- only true after successful fetch
  const [isVoting, setIsVoting] = useState({}); // { [entryId]: true }
  const [votedMap, setVotedMap] = useState({}); // { [entryId]: true }

  const abortRef = useRef(null);

  async function load() {
    // keep spinner if first load hasn’t succeeded yet
    setLoading((prev) => (hasLoaded ? prev : true));

    let aborted = false;
    try {
      // cancel any in-flight request before starting a new one
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const res = await fetch(`/api/contest/${slug}/entries`, {
        cache: "no-store",
        signal: ac.signal,
      });
      const json = await res.json();
      const list = Array.isArray(json.entries) ? json.entries : [];

      setEntries(list);

      // hydrate voted map from localStorage
      const next = {};
      for (const e of list) {
        if (localStorage.getItem(`voted-${slug}-${e.id}`)) next[e.id] = true;
      }
      setVotedMap(next);

      setHasLoaded(true); // ✅ success
    } catch (e) {
      if (e?.name === "AbortError") {
        aborted = true; // swallow; navigation/hot-reload
      } else {
        console.error("load error", e);
      }
    } finally {
      if (!aborted) setLoading(false); // don’t end loading on aborted fetch
    }
  }

  useEffect(() => {
    setHasLoaded(false);
    setLoading(true);
    load();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function vote(entryId) {
    if (votedMap[entryId] || isVoting[entryId]) return;

    setIsVoting((p) => ({ ...p, [entryId]: true }));
    // optimistic bump
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, votes: (e.votes || 0) + 1 } : e
      )
    );

    try {
      const res = await fetch(`/api/contest/${slug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });

      if (res.ok) {
        localStorage.setItem(`voted-${slug}-${entryId}`, "1");
        setVotedMap((p) => ({ ...p, [entryId]: true }));
      } else {
        // rollback
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entryId
              ? { ...e, votes: Math.max(0, (e.votes || 1) - 1) }
              : e
          )
        );
        const j = await res.json().catch(() => ({}));
        if (j?.error === "already_voted_entry") {
          localStorage.setItem(`voted-${slug}-${entryId}`, "1");
          setVotedMap((p) => ({ ...p, [entryId]: true }));
        } else {
          alert("Vote failed. Please try again.");
        }
      }
    } catch {
      // network rollback
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, votes: Math.max(0, (e.votes || 1) - 1) }
            : e
        )
      );
      alert("Vote failed. Please try again.");
    } finally {
      setIsVoting((p) => ({ ...p, [entryId]: false }));
      load(); // reconcile with server totals
    }
  }

  return (
    <main className="container mx-auto p-4">
      {/* simple static header */}
      

      <div className="container mx-auto p-4">
        <p className="opacity-70 text-sm mb-4">
          You can vote on multiple entries, but only once per entry per
          device/IP. 🐾
        </p>
      </div>

      {!hasLoaded || loading ? (
        <div className="text-center py-12">Loading entries…</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          No entries yet. Check back soon!
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {entries.map((e) => (
            <li key={e.id} className="card bg-base-200">
              <figure className="aspect-square overflow-hidden">
                <img
                  src={cldUrl(e.publicId || e.imageUrl)}
                  alt={e.title || "Contest entry"}
                  className="w-full h-full object-cover"
                />
              </figure>
              <div className="card-body gap-2">
                <h3 className="card-title text-base">
                  {e.title || "Untitled entry"}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="badge badge-outline tabular-nums">
                    {e.votes ?? 0} votes
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => vote(e.id)}
                    disabled={!!votedMap[e.id] || !!isVoting[e.id]}
                  >
                    {votedMap[e.id]
                      ? "Voted"
                      : isVoting[e.id]
                        ? "Voting…"
                        : "Vote"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
