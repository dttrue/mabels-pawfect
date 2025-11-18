// components/SeasonalBanner.jsx

"use client";
import { useEffect, useState } from "react";
import { trackPricingCTA } from "@/lib/ga-events";

export default function SeasonalBanner({
  title = "🦃 Thanksgiving Specials",
  subtitle = "Seasonal pricing through Nov 30",
  link = "/pricing-seasonal",
  id = "seasonal-banner-2025-11",
  dismissible = true,

  offsetTop = 64,
  sticky = true,
  fixed = false,
  compactScrollY = 12,

  // Autumn palette
  bg = "bg-gradient-to-r from-[#3b1f0e] via-[#5a2e0f] to-[#3b1f0e]",
  fg = "text-amber-100",
  accent = "bg-amber-400",
  showAccent = true,
  className = "",
}) {
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (!dismissible) return;
    if (typeof window !== "undefined") {
      setHidden(localStorage.getItem(id) === "1");
    }
  }, [dismissible, id]);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > compactScrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [compactScrollY]);

  if (hidden) return null;

  const placement = sticky
    ? `sticky top-[${offsetTop}px]`
    : fixed
      ? "fixed top-0 left-0 w-full"
      : "";

  const padY = compact ? "py-2" : "py-2.5 md:py-3";
  const leftPad = showAccent ? "pl-3 sm:pl-4" : "";

  const handlePricingClick = () => {
    console.log("🔥 pricing CTA clicked");
    trackPricingCTA({
      page: "pricing-seasonal",
      location: "thanksgiving-banner",
    });
  };


  return (
    <>
      {fixed && <div style={{ height: offsetTop }} aria-hidden />}

      <div
        role="region"
        aria-label={title}
        className={[
          placement,
          "z-40 w-full border-b border-white/10",
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

          {/* Left: title + subtitle (clickable, tracked) */}
          <a
            href={link}
            onClick={handlePricingClick}
            className="group flex-1 min-w-0 text-center"
          >
            <div className="leading-snug flex items-center justify-center gap-1 px-2">
              <span className="inline-block animate-turkey" aria-hidden>
                🦃
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-xs sm:text-sm md:text-base tracking-wide whitespace-normal">
                  {title.replace("🦃 ", "")}
                </div>
                {subtitle && (
                  <div className="text-[11px] sm:text-xs md:text-sm opacity-90 mt-0.5 underline decoration-transparent underline-offset-2 group-hover:decoration-current transition-[text-decoration-color] whitespace-normal leading-snug">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
          </a>

          {/* Right: CTA + trailing icon (also tracked) */}
          <div className="flex items-center gap-2 w-auto sm:w-[220px] justify-end">
            <span aria-hidden className="text-sm sm:text-base animate-leaf">
              🍁
            </span>
            <a
              href={link}
              onClick={handlePricingClick}
              className="shrink-0 inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs sm:text-sm font-semibold bg-amber-400 text-black hover:bg-amber-300 ring-1 ring-black/10 shadow-sm"
            >
              See Holiday Pricing
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
          @keyframes turkeyBob {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-2px);
            }
          }
          .animate-turkey {
            animation: turkeyBob 2.2s ease-in-out infinite;
            display: inline-block;
            transform-origin: center;
          }

          @keyframes leafSway {
            0%,
            100% {
              transform: translateX(0) rotate(0deg);
            }
            50% {
              transform: translateX(2px) rotate(-3deg);
            }
          }
          .animate-leaf {
            animation: leafSway 3s ease-in-out infinite;
            display: inline-block;
            transform-origin: 50% 0%;
          }
        }
      `}</style>
    </>
  );
}
