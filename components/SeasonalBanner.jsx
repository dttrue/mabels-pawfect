// components/SeasonalBanner.jsx
"use client";
import { useEffect, useState } from "react";
import { trackPricingCTA } from "@/lib/ga-events";

export default function SeasonalBanner({
  title = "Specials & Updates",
  subtitle = "Check current pricing and availability",
  link = "/pricing-seasonal",
  ctaText = "View Pricing",
  id = "seasonal-banner",
  dismissible = true,

  offsetTop = 64,
  sticky = true,
  fixed = false,
  compactScrollY = 12,

  // Icons (now configurable)
  leftIcon = "🐾",
  rightIcon = "📌",

  // Theme props
  bg,
  fg,
  accent,
  pattern = "",
  showAccent = true,
  className = "",

  // Analytics
  analyticsPage = "homepage",
  analyticsLocation = "seasonal_banner",
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

  const handleClick = () => {
    trackPricingCTA({
      page: analyticsPage,
      location: analyticsLocation,
    });
  };

  // Fallback theme (homepage-ish)
  const safeBg = bg || "bg-white";
  const safeFg = fg || "text-pink-700";
  const safeAccent = accent || "bg-pink-500";

  return (
    <>
      {fixed && <div style={{ height: offsetTop }} aria-hidden />}

      <div
        role="region"
        aria-label={title}
        className={[
          placement,
          "z-40 w-full border-b border-pink-100",
          safeBg,
          safeFg,
          pattern,
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
              className={`absolute left-0 top-0 h-full w-1 ${safeAccent}`}
              aria-hidden
            />
          )}

          {/* Left: title + subtitle */}
          <a href={link} onClick={handleClick} className="group flex-1 min-w-0">
            <div className="leading-snug flex items-center justify-center gap-2 px-2 text-center">
              <span aria-hidden className="text-sm sm:text-base">
                {leftIcon}
              </span>

              <div className="min-w-0">
                <div className="font-semibold text-xs sm:text-sm md:text-base tracking-wide whitespace-normal">
                  {title}
                </div>

                {subtitle && (
                  <div className="text-[11px] sm:text-xs md:text-sm opacity-90 mt-0.5 underline decoration-transparent underline-offset-2 group-hover:decoration-current transition-[text-decoration-color] whitespace-normal leading-snug">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
          </a>

          {/* Right: CTA */}
          <div className="flex items-center gap-2 w-auto sm:w-[220px] justify-end">
            <span aria-hidden className="text-sm sm:text-base">
              {rightIcon}
            </span>

            <a
              href={link}
              onClick={handleClick}
              className={`shrink-0 inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:opacity-95 ring-1 ring-black/5 shadow-sm ${safeAccent}`}
            >
              {ctaText}
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
              className="ml-2 hidden sm:grid place-items-center w-7 h-7 rounded-md text-pink-700/70 hover:text-pink-800 bg-pink-50 hover:bg-pink-100 border border-pink-200"
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
    </>
  );
}
