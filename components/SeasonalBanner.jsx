"use client";
import { useEffect, useState } from "react";

export default function SeasonalBanner({
  title = "🎃 Halloween Specials",
  subtitle = "Out of Office Oct 27–31 • Book early!",
  link = "/price",
  id = "seasonal-banner-2025-10",
  dismissible = true,

  // navbar height to sit UNDER it (tailor to your nav height)
  offsetTop = 64,

  // behavior
  sticky = true, // sticky under the navbar (recommended)
  fixed = false, // set true if you prefer fixed; a spacer will be added
  compactScrollY = 12,

  // theme
  bg = "bg-gradient-to-r from-[#0d0d0f] via-black to-[#0d0d0f]",
  fg = "text-[#FFE8B0]",
  accent = "bg-[#FF6A00]",
  showAccent = true,
  className = "",
}) {
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);

  // restore dismissed state
  useEffect(() => {
    if (!dismissible) return;
    if (typeof window !== "undefined") {
      setHidden(localStorage.getItem(id) === "1");
    }
  }, [dismissible, id]);

  // shrink on scroll
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > compactScrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [compactScrollY]);

  if (hidden) return null;

  const placement = sticky
    ? `sticky top-[${offsetTop}px]` // sits under navbar, scrolls with page
    : fixed
      ? "fixed top-0 left-0 w-full"
      : "";

  const padY = compact ? "py-2" : "py-2.5 md:py-3";
  const leftPad = showAccent ? "pl-3 sm:pl-4" : "";

  return (
    <>
      {/* optional spacer if you choose fixed */}
      {fixed && <div style={{ height: offsetTop }} aria-hidden />}

      <div
        role="region"
        aria-label={title}
        className={[
          placement,
          "z-40", // below nav (use nav z-50+)
          "w-full border-b border-white/10",
          bg,
          fg,
          "px-3 sm:px-4",
          padY,
          "transition-[padding] duration-200",
          className,
        ].join(" ")}
        style={sticky ? { top: offsetTop } : undefined}
      >
        <div
          className={`relative mx-auto max-w-6xl flex items-center justify-between ${leftPad}`}
        >
          {showAccent && (
            <span
              className={`absolute left-0 top-0 h-full w-1 ${accent}`}
              aria-hidden
            />
          )}

          {/* Left: title + subtitle */}
          <a href={link} className="group flex-1 min-w-0 text-center">
            <div className="leading-snug flex items-center justify-center gap-1">
              <span className="inline-block animate-pumpkin" aria-hidden>
                🎃
              </span>
              <div className="truncate">
                <div className="font-semibold text-sm sm:text-base tracking-wide truncate">
                  {title.replace("🎃 ", "")}
                </div>
                {subtitle && (
                  <div className="text-xs sm:text-sm opacity-90 mt-0.5 underline decoration-transparent underline-offset-2 group-hover:decoration-current transition-[text-decoration-color] truncate">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
          </a>

          {/* Right: CTA + trailing icon */}
          <div className="flex items-center gap-2 w-auto sm:w-[220px] justify-end">
            <span aria-hidden className="text-sm sm:text-base animate-web-sway">
              🕸️
            </span>
            <a
              href={link}
              className="shrink-0 inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs sm:text-sm font-semibold bg-[#FF6A00] text-black hover:bg-[#ff7d1f] ring-1 ring-black/10 shadow-sm"
            >
              See Fall Pricing
            </a>
          </div>

          {dismissible && (
            <button
              type="button"
              aria-label="Dismiss announcement"
              onClick={() => {
                if (typeof window !== "undefined")
                  localStorage.setItem(id, "1");
                setHidden(true);
              }}
              className="ml-2 hidden sm:grid place-items-center w-7 h-7 rounded-md text-white/70 hover:text-white bg-white/5 hover:bg-white/10"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 1l12 12M13 1 1 13"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* animations */}
      <style jsx>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes pumpkinPulse {
            0%,
            100% {
              transform: scale(1);
              filter: drop-shadow(0 0 0 rgba(255, 106, 0, 0));
            }
            50% {
              transform: scale(1.15);
              filter: drop-shadow(0 0 6px rgba(255, 106, 0, 0.6));
            }
          }
          .animate-pumpkin {
            animation: pumpkinPulse 2.5s ease-in-out infinite;
            transform-origin: center;
          }

          @keyframes webSway {
            0%,
            100% {
              transform: translateX(0) rotate(0deg);
            }
            50% {
              transform: translateX(2px) rotate(2deg);
            }
          }
          .animate-web-sway {
            animation: webSway 3s ease-in-out infinite;
            display: inline-block;
            transform-origin: 50% 0%;
          }
        }
      `}</style>
    </>
  );
}
