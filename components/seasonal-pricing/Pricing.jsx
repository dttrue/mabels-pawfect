// components/seasonal-pricing/Pricing.jsx
"use client";

import Link from "next/link";
import useSWR from "swr";
import ShamrockOverlay from "@/components/ShamrockOverlay";
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Pricing() {
  <ShamrockOverlay />
  const imageKey = "pricing-flyer-main";

  const { data } = useSWR(
    imageKey
      ? `/api/admin/site-images?key=${encodeURIComponent(imageKey)}`
      : null,
    fetcher
  );

  const src = data?.image?.imageUrl ?? null;
  const alt =
    data?.image?.alt || "Seasonal pet care pricing flyer for dog and cat care.";
  const validity =
    data?.image?.subtitle || "Seasonal pricing (limited-time availability)";

  return (
    <main className="relative min-h-screen bg-white overflow-x-hidden">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-emerald-200">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-emerald-700">
            St. Patrick’s Seasonal Pricing ☘️
          </h1>

          <div className="flex items-center gap-2">
            {src && (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Open Flyer
              </a>
            )}

            <Link
              href="/booking"
              className="rounded-md border border-emerald-300 px-3.5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Book Now
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="relative z-10 py-12 px-4">
        <div className="mx-auto max-w-5xl">
          <figure className="bg-emerald-50 border border-emerald-100 rounded-2xl shadow-md p-4">
            {src ? (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open full-size seasonal pricing flyer"
              >
                <img src={src} alt={alt} className="w-full h-auto rounded-xl" />
              </a>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-white/60 text-xs text-emerald-700">
                Seasonal pricing flyer will appear here once it’s uploaded in
                the admin.
              </div>
            )}

            <figcaption className="mt-4 flex flex-wrap gap-2 text-xs text-emerald-800">
              <span className="rounded-full bg-white px-3 py-1 border border-emerald-200">
                {validity}
              </span>
              <span className="rounded-full bg-white px-3 py-1 border border-emerald-200">
                St. Patrick’s period • March 1 – March 31
              </span>
              <span className="rounded-full bg-white px-3 py-1 border border-emerald-200">
                Peak evenings & weekends fill fast
              </span>
            </figcaption>
          </figure>
        </div>
      </section>
    </main>
  );
}
