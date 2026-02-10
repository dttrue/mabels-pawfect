// components/specials/ValentinesSpecials.jsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { trackPricingCTA, trackBookingCTA } from "@/lib/ga-events";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function ValentinesSpecials({
  title = "Valentine’s Day Specials ❤️",
  subtitle = "Sweetheart rates are live through Feb 16.",
  ctaHref = "/pricing-seasonal",
  ctaText = "See Valentine’s Pricing",
  imageSrc = "/images/seasonal-pricing/valentines-pricing-2026.jpg",
  // 🔑 same stable key as Pricing.jsx so the latest flyer shows everywhere
  imageKey = "pricing-flyer-main",
}) {
  const { data } = useSWR(
    imageKey
      ? `/api/admin/site-images?key=${encodeURIComponent(imageKey)}`
      : null,
    fetcher
  );

  const cloudImage = data?.image?.imageUrl || null;
  const cloudAlt = data?.image?.alt || null;

  const finalImageSrc = cloudImage || imageSrc;
  const finalAlt =
    cloudAlt || "Valentine’s 2026 pet care pricing flyer – dogs & cats";

  const handlePricingClick = () => {
    trackPricingCTA({
      page: "homepage",
      location: "valentines_specials",
    });
  };

  const handleBookNow = () => {
    trackBookingCTA({
      page: "homepage",
      location: "valentines_specials",
    });
  };

  const handleFlyerClick = () => {
    trackPricingCTA({
      page: "homepage",
      location: "valentines_specials_flyer",
    });
  };

  return (
    <section
      aria-labelledby="valentines-specials-heading"
      className="relative isolate mx-auto max-w-6xl px-4 py-12 md:py-16"
    >
      {/* background panel */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-[#3a0313] via-[#4f0820] to-[#19000c] ring-1 ring-white/10 shadow-sm" />

      <div className="grid items-center gap-8 md:grid-cols-[1.1fr,0.9fr]">
        {/* copy column */}
        <div>
          <h2
            id="valentines-specials-heading"
            className="text-2xl md:text-3xl font-semibold text-rose-100"
          >
            {title}
          </h2>
          <p className="mt-2 text-[13px] md:text-base text-rose-50/90 drop-shadow-[0_1px_0_rgba(0,0,0,.35)]">
            {subtitle}
          </p>

          <ul className="mt-6 space-y-3 text-rose-50">
            <li className="flex items-start gap-2">
              <span aria-hidden>🐾</span>
              <span>Drop-ins for dogs & cats • 15 / 30 / 60 minute visits</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>💌</span>
              <span>
                Valentine’s add-ons: heart-shaped treats, photo updates, and
                extra cuddle time
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>📅</span>
              <span>
                Limited Valentine’s slots — peak evening and weekend spots book
                fast
              </span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              onClick={handlePricingClick}
              className="inline-flex items-center justify-center rounded-md bg-rose-400 px-4 py-2.5 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-rose-300"
            >
              {ctaText}
            </Link>

            <Link
              href="/booking"
              onClick={handleBookNow}
              className="inline-flex items-center justify-center rounded-md border border-rose-50/20 px-4 py-2.5 text-sm font-semibold text-rose-50 hover:bg-rose-50/5"
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* flyer column */}
        <div className="relative">
          <div className="rounded-xl border border-white/10 bg-[#19000c] p-2 shadow-sm">
            <Link
              href={ctaHref}
              onClick={handleFlyerClick}
              aria-label="Open Valentine’s pricing"
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

          <div className="pointer-events-none absolute -left-2 -top-2 h-8 w-8 rounded-full bg-rose-400/40 blur-md md:h-10 md:w-10" />
        </div>
      </div>
    </section>
  );
}
