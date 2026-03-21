// components/SpringOverlay.jsx
"use client";

import { useMemo } from "react";

function makeParticles(count) {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 10 + Math.random() * 10, // slower = softer feel
    size: 0.8 + Math.random() * 0.8,
    drift: (Math.random() - 0.5) * 40, // side drift for natural float
  }));
}

const DEFAULT_ICONS = ["🌸", "🌼", "🐣", "🦋", "🌷"];

export default function SpringOverlay({
  variant = "float", // float feels better than "rain"
  count = 32,
  icons = DEFAULT_ICONS,
  className = "",
}) {
  const particles = useMemo(() => makeParticles(count), [count]);

  const animClass =
    variant === "rain" ? "animate-spring-rain" : "animate-spring-float";

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-30 overflow-hidden ${className}`}
    >
      {particles.map((p) => {
        const icon = icons[Math.floor(Math.random() * icons.length)];

        return (
          <div
            key={p.id}
            className={`absolute ${animClass}`}
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              transform: `translateX(${p.drift}px)`,
            }}
          >
            <span
              className="inline-block text-2xl md:text-3xl"
              style={{ transform: `scale(${p.size})` }}
            >
              {icon}
            </span>
          </div>
        );
      })}
    </div>
  );
}
