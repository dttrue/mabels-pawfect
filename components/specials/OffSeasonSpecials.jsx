"use client";
import Link from "next/link";
import Image from "next/image";
import { trackPricingCTA, trackBookingCTA } from "@/lib/ga-events";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function OffSeasonSpecials({
  title = "Off-Season Updates 🐾",
  subtitle = "Regular pricing is active. Seasonal specials return for Valentine’s Week.",
  ctaHref = "/pricing",
  ctaText = "See Regular Pricing",
  imageSrc = "/images/specials/off-season.jpg",
  imageKey = "pricing-flyer-main",
}) {
  const apiUrl = imageKey
    ? `/api/admin/site-images?key=${encodeURIComponent(imageKey)}`
    : null;

  const { data } = useSWR(apiUrl, fetcher);

  const cloudImage = data?.image?.imageUrl || null;
  const cloudAlt = data?.image?.alt || null;

  const finalImageSrc = cloudImage || imageSrc;
  const finalAlt =
    cloudAlt || "Regular pricing flyer – pet sitting and drop-in visits";

  const handlePricingClick = () => {
    trackPricingCTA({
      page: "specials",
      location: "off_season",
    });
  };

  const handleBookNow = () => {
    trackBookingCTA({
      page: "specials",
      location: "off_season",
    });
  };

  const handleFlyerClick = () => {
    trackPricingCTA({
      page: "specials",
      location: "off_season_flyer",
    });
  };

  return (
    <section
      aria-labelledby="off-season-heading"
      className="relative isolate mx-auto max-w-6xl px-4 py-12 md:py-16"
    >
      {/* neutral background panel */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 ring-1 ring-white/10 shadow-sm" />

      <div className="grid items-center gap-8 md:grid-cols-[1.1fr,0.9fr]">
        {/* copy column */}
        <div>
          <h2
            id="off-season-heading"
            className="text-2xl md:text-3xl font-semibold text-white"
          >
            {title}
          </h2>

          <p className="mt-2 text-[13px] md:text-base text-white/80">
            {subtitle}
          </p>

          <ul className="mt-6 space-y-3 text-white/85">
            <li className="flex items-start gap-2">
              <span aria-hidden>✅</span>
              <span>Regular rates for drop-ins, walks, and sitting</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>📅</span>
              <span>Peak weeks can fill up fast — booking early helps</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>💌</span>
              <span>
                Want updates? Check back here for Valentine’s specials
              </span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              onClick={handlePricingClick}
              className="inline-flex items-center justify-center rounded-md bg-pink-400 px-4 py-2.5 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-pink-300"
            >
              {ctaText}
            </Link>

            <Link
              href="/booking"
              onClick={handleBookNow}
              className="inline-flex items-center justify-center rounded-md border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* flyer column */}
        <div className="relative">
          <div className="rounded-xl border border-white/10 bg-neutral-950 p-2 shadow-sm">
            <Link
              href={ctaHref}
              onClick={handleFlyerClick}
              aria-label="Open regular pricing"
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
          </div>

          <div className="pointer-events-none absolute -left-2 -top-2 h-8 w-8 rounded-full bg-pink-400/25 blur-md md:h-10 md:w-10" />
        </div>
      </div>
    </section>
  );
}
