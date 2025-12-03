// components/specials/ChristmasSpecials.jsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { trackPricingCTA, trackBookingCTA } from "@/lib/ga-events";

export default function ChristmasSpecials({
  title = "Christmas Specials 🎄",
  subtitle = "Holiday rates are live through Dec 31.",
  ctaHref = "/pricing-seasonal",
  ctaText = "See Christmas Pricing",
  imageSrc = "/images/seasonal-pricing/christmas-pricing-2025.jpg",
}) {
  const handlePricingClick = () => {
    trackPricingCTA({
      page: "homepage",
      location: "christmas_specials",
    });
  };

  const handleBookNow = () => {
    trackBookingCTA({
      page: "homepage",
      location: "christmas_specials",
    });
  };

  const handleFlyerClick = () => {
    trackPricingCTA({
      page: "homepage",
      location: "christmas_specials_flyer",
    });
  };

  return (
    <section
      aria-labelledby="christmas-specials-heading"
      className="relative isolate mx-auto max-w-6xl px-4 py-12 md:py-16"
    >
      {/* background panel */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-[#052016] via-[#073322] to-[#020f0a] ring-1 ring-white/10 shadow-sm" />

      <div className="grid items-center gap-8 md:grid-cols-[1.1fr,0.9fr]">
        {/* copy column */}
        <div>
          <h2
            id="christmas-specials-heading"
            className="text-2xl md:text-3xl font-semibold text-emerald-100"
          >
            {title}
          </h2>
          <p className="mt-2 text-[13px] md:text-base text-emerald-50/90 drop-shadow-[0_1px_0_rgba(0,0,0,.35)]">
            {subtitle}
          </p>

          <ul className="mt-6 space-y-3 text-emerald-50">
            <li className="flex items-start gap-2">
              <span aria-hidden>🦴</span>
              <span>Drop-ins for dogs & cats • 15/30/60 minute options</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>🎁</span>
              <span>
                Holiday add-ons: special treats, photos, and extra snuggle time
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>📅</span>
              <span>Valid through Dec 31 — limited slots during peak days</span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              onClick={handlePricingClick}
              className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-emerald-300"
            >
              {ctaText}
            </Link>

            <Link
              href="/booking"
              onClick={handleBookNow}
              className="inline-flex items-center justify-center rounded-md border border-emerald-50/20 px-4 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-emerald-50/5"
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* flyer column */}
        <div className="relative">
          <div className="rounded-xl border border-white/10 bg-[#020f0a] p-2 shadow-sm">
            <Link
              href={ctaHref}
              onClick={handleFlyerClick}
              aria-label="Open Christmas pricing"
            >
              <Image
                src={imageSrc}
                alt="Christmas 2025 pricing flyer – dogs & cats"
                width={880}
                height={1360}
                className="h-auto w-full rounded-lg"
                sizes="(max-width: 768px) 100vw, 880px"
                priority
              />
            </Link>
          </div>

          <div className="pointer-events-none absolute -left-2 -top-2 h-8 w-8 rounded-full bg-emerald-400/30 blur-md md:h-10 md:w-10" />
        </div>
      </div>
    </section>
  );
}
