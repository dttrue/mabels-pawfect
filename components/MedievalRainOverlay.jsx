// components/MedievalRainOverlay.jsx
"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_ITEMS = [
  "👑",
  "⚜️",
  "🏰",
  "🌹",
  "📜",
  "✨",
  "🐾",
  "🎀",
  "🕯️",
  "💎",
  "🧚",
  "⚔️",
  "🛡️",
];

export default function MedievalRainOverlay({
  count = 28,
  items = DEFAULT_ITEMS,
  minDuration = 8,
  maxDuration = 16,
}) {
  const [pieces, setPieces] = useState([]);

  const safeItems = useMemo(() => {
    return Array.isArray(items) && items.length > 0 ? items : DEFAULT_ITEMS;
  }, [items]);

  useEffect(() => {
    const generatedPieces = Array.from({ length: count }, (_, i) => {
      const item = safeItems[i % safeItems.length];
      const left = Math.random() * 100;
      const delay = Math.random() * -maxDuration;
      const duration =
        minDuration + Math.random() * (maxDuration - minDuration);
      const size = 16 + Math.random() * 16;
      const opacity = 0.35 + Math.random() * 0.45;

      return {
        id: i,
        item,
        style: {
          left: `${left}%`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          fontSize: `${size}px`,
          opacity,
        },
      };
    });

    setPieces(generatedPieces);
  }, [count, safeItems, minDuration, maxDuration]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      <style jsx>{`
        @keyframes medieval-rain {
          0% {
            transform: translateY(-12vh) rotate(0deg);
          }
          100% {
            transform: translateY(112vh) rotate(360deg);
          }
        }

        .medieval-rain-piece {
          animation-name: medieval-rain;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
      `}</style>

      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="medieval-rain-piece absolute -top-10 inline-block select-none"
          style={piece.style}
        >
          {piece.item}
        </span>
      ))}
    </div>
  );
}
