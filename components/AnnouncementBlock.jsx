// components/AnnouncementBlock.jsx
"use client";

import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { trackEvent } from "@/lib/ga-events";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AnnouncementBlock({
  title = "Holiday Digital Postcard 🎄",
  body = "Share our Christmas postcard and check out seasonal rates through Dec 31.",
  imageSrc = "/images/postcards/christmas-postcard-2025.jpg",
  imageKey = "announcement-main", // 🔥 stable key for Cloudinary
  ctaHref = "/pricing",
  ctaText = "View Pricing",
  secondaryHref = "/gallery",
  secondaryText = "See More Photos",
  analyticsPage = "pricing-seasonal",
  analyticsVariant = "christmas-2025",
}) {
  // Try to load Cloudinary image for this announcement
  const { data } = useSWR(
    imageKey
      ? `/api/admin/site-images?key=${encodeURIComponent(imageKey)}`
      : null,
    fetcher
  );

  const cloudImage = data?.image?.imageUrl || null;
  const finalImageSrc =
    cloudImage || imageSrc || "/images/postcards/christmas-postcard-2025.jpg";

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
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#052016] via-[#073322] to-[#020f0a]">
        <div className="grid gap-0 md:grid-cols-2">
          {/* image */}
          <div className="relative">
            <Image
              src={finalImageSrc}
              alt={title}
              width={1200}
              height={900}
              className="h-full w-full object-cover"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />
          </div>

          {/* copy */}
          <div className="relative p-6 md:p-8">
            <h3
              id="announcement-heading"
              className="text-xl md:text-2xl font-semibold text-emerald-100"
            >
              {title}
            </h3>

            <p className="mt-2 text-emerald-50/90">{body}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {/* PRIMARY CTA */}
              <Link
                href={ctaHref}
                onClick={trackPrimary}
                className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-emerald-300"
              >
                {ctaText}
              </Link>

              {/* SECONDARY CTA */}
              {secondaryHref && secondaryText && (
                <Link
                  href={secondaryHref}
                  onClick={trackSecondary}
                  className="inline-flex items-center justify-center rounded-md border border-emerald-100/30 px-4 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-emerald-50/5"
                >
                  {secondaryText}
                </Link>
              )}
            </div>

            {/* soft glow */}
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-24 w-24 rounded-full bg-emerald-300/25 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
