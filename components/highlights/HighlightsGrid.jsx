// components/highlights/HighlightsGrid.jsx
"use client";

import HighlightCard from "./HighlightCard";

export default function HighlightsGrid({ items }) {
  if (!items?.length) return <p className="opacity-70">No highlights yet.</p>;

  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((h) => (
        <li
          key={h.id}
          className="border rounded-xl overflow-hidden bg-base-100 hover:shadow transition"
        >
          <HighlightCard item={h} />
        </li>
      ))}
    </ul>
  );
}
