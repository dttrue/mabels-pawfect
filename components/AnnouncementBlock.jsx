// components/AnnouncementBlock.jsx
"use client";

import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { trackEvent } from "@/lib/ga-events";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AnnouncementBlock({
  title = "Pricing & Updates 🐾",
  body = "Regular pricing is active. Seasonal specials return for Valentine’s Week — check back soon!",
  imageSrc = "/images/postcards/christmas-postcard-2025.jpg", // fallback if Cloudinary missing
  imageKey = "announcement-main",
  ctaHref = "/pricing-seasonal",
  ctaText = "View Pricing",
  secondaryHref = "/gallery",
  secondaryText = "See More Photos",
  analyticsPage = "homepage",
  analyticsVariant = "off-season",
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
  const finalAlt = cloudAlt || title;

  function trackPrimary() {
    trackEvent("announcement_primary_click", {
      page: analyticsPage,
      announcement_variant: analyticsVariant,
      cta_type: "primary",
      destination: ctaHref,
    });
  }

  function trackSecondary() {
    trackEvent("announcement_secondary_click", {
      page: analyticsPage,
      announcement_variant: analyticsVariant,
      cta_type: "secondary",
      destination: secondaryHref,
    });
  }

  return (
    <section
      aria-labelledby="announcement-heading"
      className="mx-auto max-w-6xl px-4 py-12"
    >
      <div className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-md">
        <div className="grid gap-0 md:grid-cols-2">
          {/* image */}
          <div className="relative">
            <Image
              src={finalImageSrc}
              alt={finalAlt}
              width={1200}
              height={900}
              className="h-full w-full object-cover"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent" />
          </div>

          {/* copy */}
          <div className="relative p-6 md:p-8">
            <h3
              id="announcement-heading"
              className="text-xl md:text-2xl font-bold text-pink-600"
            >
              {title}
            </h3>

            <p className="mt-2 text-gray-700">{body}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {/* PRIMARY CTA */}
              <Link
                href={ctaHref}
                onClick={trackPrimary}
                className="inline-flex items-center justify-center rounded-md bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-600"
              >
                {ctaText}
              </Link>

              {/* SECONDARY CTA */}
              {secondaryHref && secondaryText && (
                <Link
                  href={secondaryHref}
                  onClick={trackSecondary}
                  className="inline-flex items-center justify-center rounded-md border border-pink-300 px-4 py-2.5 text-sm font-semibold text-pink-600 hover:bg-pink-50"
                >
                  {secondaryText}
                </Link>
              )}
            </div>

            {/* soft accent */}
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-24 w-24 rounded-full bg-pink-200/50 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
