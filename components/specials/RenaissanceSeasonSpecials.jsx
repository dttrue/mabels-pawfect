// components/specials/RenaissanceSeasonSpecials.jsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { trackPricingCTA, trackBookingCTA } from "@/lib/ga-events";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function RenaissanceSeasonSpecials({
  title = "Renaissance Season at Mabel’s 🏰",
  subtitle = "A royal little refresh is here. Regular pricing is active for pet sitting, walks, and drop-in visits.",
  ctaHref = "/pricing",
  ctaText = "View Pricing",
  imageSrc = "/images/specials/renaissance-season.jpg",
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
    cloudAlt ||
    "Renaissance themed pet services flyer with three pets in medieval attire";

  const handlePricingClick = () => {
    trackPricingCTA({
      page: "specials",
      location: "renaissance_season",
    });
  };

  const handleBookNow = () => {
    trackBookingCTA({
      page: "specials",
      location: "renaissance_season",
    });
  };

  const handleFlyerClick = () => {
    trackPricingCTA({
      page: "specials",
      location: "renaissance_season_flyer",
    });
  };

  return (
    <section
      aria-labelledby="renaissance-season-heading"
      className="relative isolate mx-auto max-w-6xl px-4 py-12 md:py-16"
    >
      <div className="absolute inset-0 -z-10 rounded-3xl bg-[#f4ead8] ring-1 ring-[#6f4e2f]/20 shadow-sm" />

      <div className="pointer-events-none absolute inset-3 -z-10 rounded-[1.35rem] border border-[#8b6a3f]/25" />

      <div className="grid items-center gap-8 md:grid-cols-[1.05fr,0.95fr]">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b5e34]">
            Mabel’s Pawfect Pet Services
          </p>

          <h2
            id="renaissance-season-heading"
            className="font-serif text-3xl font-semibold leading-tight text-[#2f2418] md:text-4xl"
          >
            {title}
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#5f4630] md:text-base">
            {subtitle}
          </p>

          <ul className="mt-6 space-y-3 text-sm text-[#3f3022] md:text-base">
            <li className="flex items-start gap-2">
              <span aria-hidden>⚜️</span>
              <span>Regular rates for drop-ins, walks, and sitting</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>📜</span>
              <span>Peak weeks can fill up fast — early booking is wise</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>👑</span>
              <span>Seasonal specials and royal updates return soon</span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              onClick={handlePricingClick}
              className="inline-flex items-center justify-center rounded-md bg-[#5a3822] px-4 py-2.5 text-sm font-semibold text-[#fff8ec] ring-1 ring-black/10 hover:bg-[#472b1a]"
            >
              {ctaText}
            </Link>

            <Link
              href="/booking"
              onClick={handleBookNow}
              className="inline-flex items-center justify-center rounded-md border border-[#6f4e2f]/35 px-4 py-2.5 text-sm font-semibold text-[#3a281a] hover:bg-[#eadcc4]"
            >
              Book Now
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl border border-[#6f4e2f]/25 bg-[#fff7e8] p-2 shadow-sm">
            <Link
              href={ctaHref}
              onClick={handleFlyerClick}
              aria-label="Open pricing"
            >
              <Image
                src={finalImageSrc}
                alt={finalAlt}
                width={880}
                height={1360}
                className="h-auto w-full rounded-xl"
                sizes="(max-width: 768px) 100vw, 880px"
                priority
              />
            </Link>
          </div>

          <div className="pointer-events-none absolute -right-3 -top-3 rounded-full bg-[#c69b5c]/25 px-3 py-1 text-xs font-semibold text-[#5a3822] ring-1 ring-[#8b6a3f]/20 backdrop-blur-sm">
            ⚜️ Royal Care
          </div>
        </div>
      </div>
    </section>
  );
}
