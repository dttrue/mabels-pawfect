// components/ShamrockOverlay.jsx
"use client";

import { useMemo } from "react";

function makeParticles(count) {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 100, // percentage across the screen
    delay: Math.random() * 10, // seconds
    duration: 8 + Math.random() * 8, // 8–16s
    size: 0.8 + Math.random() * 0.8, // scale 0.8–1.6
  }));
}

/**
 * Reusable overlay that "snows" or "rains" shamrocks (or any icon).
 *
 * Props:
 * - variant: "snow" | "rain"
 * - count: number of shamrocks
 * - icon: string (default "☘️")
 * - className: extra classes for the outer wrapper
 */
export default function ShamrockOverlay({
  variant = "snow",
  count = 28,
  icon = "☘️",
  className = "",
}) {
  const particles = useMemo(() => makeParticles(count), [count]);
  const animClass =
    variant === "rain" ? "animate-shamrock-rain" : "animate-shamrock-fall";

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-30 overflow-hidden ${className}`}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute ${animClass}`}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          <span
            className="inline-block text-2xl md:text-3xl"
            style={{ transform: `scale(${p.size})` }}
          >
            {icon}
          </span>
        </div>
      ))}
    </div>
  );
}
