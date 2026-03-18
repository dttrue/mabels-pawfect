// components/specials/EasterSpecials.jsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { trackPricingCTA, trackBookingCTA } from "@/lib/ga-events";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function EasterSpecials({
  title = "Easter Pet Care Specials",
  subtitle = "Spring visits, festive updates, and reliable care for dogs and cats.",
  ctaHref = "/pricing-seasonal",
  ctaText = "View Easter Pricing",
  imageKey = "pricing-flyer-main",
}) {
  const { data } = useSWR(
    imageKey
      ? `/api/admin/site-images?key=${encodeURIComponent(imageKey)}`
      : null,
    fetcher
  );

  const cloudImage = data?.image?.imageUrl ?? null;
  const cloudAlt =
    data?.image?.alt ||
    "Easter themed pet care price list flyer for dogs and cats.";

  const finalImageSrc = cloudImage || null;
  const finalAlt = cloudAlt;

  const handlePricingClick = () => {
    trackPricingCTA({
      page: "homepage",
      location: "easter_specials",
    });
  };

  const handleBookNow = () => {
    trackBookingCTA({
      page: "homepage",
      location: "easter_specials",
    });
  };

  const handleFlyerClick = () => {
    trackPricingCTA({
      page: "homepage",
      location: "easter_specials_flyer",
    });
  };

  return (
    <section
      aria-labelledby="easter-specials-heading"
      className="relative isolate mx-auto max-w-6xl px-4 py-12 md:py-16"
    >
      {/* background panel */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-[#fdf2f8] via-[#fff7ed] to-[#fefce8] ring-1 ring-amber-200 shadow-sm" />

      <div className="grid items-center gap-8 md:grid-cols-[1.1fr,0.9fr]">
        {/* copy column */}
        <div>
          <h2
            id="easter-specials-heading"
            className="text-2xl font-semibold text-stone-900 md:text-3xl"
          >
            {title}
          </h2>

          <p className="mt-2 text-[13px] text-stone-700 md:text-base">
            {subtitle}
          </p>

          <ul className="mt-6 space-y-3 text-stone-800">
            <li className="flex items-start gap-2">
              <span aria-hidden>🐣</span>
              <span>
                Drop-ins for dogs & cats • 15 / 30 / 60 minute visits with
                springtime check-ins and detailed updates
              </span>
            </li>

            <li className="flex items-start gap-2">
              <span aria-hidden>📷</span>
              <span>
                Easter-themed photo updates, seasonal bandanas or bows (while
                supplies last), and extra cuddle or playtime
              </span>
            </li>

            <li className="flex items-start gap-2">
              <span aria-hidden>🌷</span>
              <span>
                Holiday weekend availability can fill quickly, so booking early
                is the smart move for Easter week and surrounding spring dates.
              </span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              onClick={handlePricingClick}
              className="inline-flex items-center justify-center rounded-md bg-amber-300 px-4 py-2.5 text-sm font-semibold text-stone-900 ring-1 ring-black/10 hover:bg-amber-200"
            >
              {ctaText}
            </Link>

            <Link
              href="/booking"
              onClick={handleBookNow}
              className="inline-flex items-center justify-center rounded-md border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-900 hover:bg-white/50"
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* flyer column */}
        <div className="relative">
          <div className="rounded-xl border border-amber-200 bg-white/70 p-2 shadow-sm backdrop-blur-sm">
            {finalImageSrc ? (
              <Link
                href={ctaHref}
                onClick={handleFlyerClick}
                aria-label="Open Easter seasonal pricing"
              >
                <Image
                  src={finalImageSrc}
                  alt={finalAlt}
                  width={880}
                  height={1360}
                  className="h-auto w-full rounded-lg"
                  sizes="(max-width: 768px) 100vw, 880px"
                  priority
                />
              </Link>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-amber-300 text-xs text-stone-600">
                Easter pricing flyer will appear here once it’s uploaded in the
                admin.
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute -left-2 -top-2 h-8 w-8 rounded-full bg-pink-200/60 blur-md md:h-10 md:w-10" />
        </div>
      </div>
    </section>
  );
}
