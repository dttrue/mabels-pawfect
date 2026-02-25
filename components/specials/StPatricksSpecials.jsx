// components/specials/StPatricksSpecials.jsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { trackPricingCTA, trackBookingCTA } from "@/lib/ga-events";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function StPatricksSpecials({
  title = "Everyday Pet Care Pricing",
  subtitle = "Reliable care for dogs and cats.",
  ctaHref = "/pricing-seasonal",
  ctaText = "View Pricing",
  // 🔑 same stable key as Pricing.jsx so the latest flyer shows everywhere
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
    "St. Patrick’s themed pet care price list flyer for dogs and cats.";

  const finalImageSrc = cloudImage || null;
  const finalAlt = cloudAlt;

  const handlePricingClick = () => {
    trackPricingCTA({
      page: "homepage",
      location: "stpatricks_specials",
    });
  };

  const handleBookNow = () => {
    trackBookingCTA({
      page: "homepage",
      location: "stpatricks_specials",
    });
  };

  const handleFlyerClick = () => {
    trackPricingCTA({
      page: "homepage",
      location: "stpatricks_specials_flyer",
    });
  };

  return (
    <section
      aria-labelledby="stpatricks-specials-heading"
      className="relative isolate mx-auto max-w-6xl px-4 py-12 md:py-16"
    >
      {/* background panel */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-[#024a2a] via-[#047857] to-[#024a2a] ring-1 ring-white/10 shadow-sm" />

      <div className="grid items-center gap-8 md:grid-cols-[1.1fr,0.9fr]">
        {/* copy column */}
        <div>
          <h2
            id="stpatricks-specials-heading"
            className="text-2xl md:text-3xl font-semibold text-emerald-50"
          >
            {title}
          </h2>
          <p className="mt-2 text-[13px] md:text-base text-emerald-50/90 drop-shadow-[0_1px_0_rgba(0,0,0,.35)]">
            {subtitle}
          </p>

          <ul className="mt-6 space-y-3 text-emerald-50">
            <li className="flex items-start gap-2">
              <span aria-hidden>🍀</span>
              <span>
                Drop-ins for dogs & cats • 15 / 30 / 60 minute visits with
                “lucky” check-ins and updates
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>📷</span>
              <span>
                Festive St. Paddy’s photos, shamrock bandanas (while supplies
                last), and extra playtime
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>📅</span>
              <span>
                Limited March availability — evening and weekend spots go first,
                especially around March 17.
              </span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              onClick={handlePricingClick}
              className="inline-flex items-center justify-center rounded-md bg-amber-300 px-4 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-black/10 hover:bg-amber-200"
            >
              {ctaText}
            </Link>

            <Link
              href="/booking"
              onClick={handleBookNow}
              className="inline-flex items-center justify-center rounded-md border border-emerald-50/30 px-4 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-emerald-50/5"
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* flyer column */}
        <div className="relative">
          <div className="rounded-xl border border-white/10 bg-[#022c22] p-2 shadow-sm">
            {finalImageSrc ? (
              <Link
                href={ctaHref}
                onClick={handleFlyerClick}
                aria-label="Open seasonal pricing"
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
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-emerald-400/40 text-xs text-emerald-50/80">
                Seasonal pricing flyer will appear here once it’s uploaded in
                the admin.
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute -left-2 -top-2 h-8 w-8 rounded-full bg-emerald-400/40 blur-md md:h-10 md:w-10" />
        </div>
      </div>
    </section>
  );
}
