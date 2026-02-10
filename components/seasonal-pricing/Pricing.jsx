// components/seasonal-pricing/Pricing.jsx
"use client";

import Link from "next/link";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Pricing() {
  const imageKey = "pricing-flyer-main";

  // 💘 Valentine fallback
  const FALLBACK_SRC = "/images/seasonal-pricing/valentines-pricing-2026.jpg";

  const { data } = useSWR(
    `/api/admin/site-images?key=${encodeURIComponent(imageKey)}`,
    fetcher
  );

  const src = data?.image?.imageUrl || FALLBACK_SRC;
  const alt =
    data?.image?.alt ||
    "Valentine’s seasonal pricing flyer for dog and cat care";

  const validity =
    data?.image?.subtitle ||
    "Valentine’s seasonal pricing (limited-time availability)";

  return (
    <main className="relative min-h-screen bg-white overflow-x-hidden">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-pink-200">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-rose-600">
            Valentine’s Seasonal Pricing ❤️
          </h1>

          <div className="flex items-center gap-2">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-rose-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Open Flyer
            </a>

            <Link
              href="/booking"
              className="rounded-md border border-rose-300 px-3.5 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              Book Now
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="relative z-10 py-12 px-4">
        <div className="mx-auto max-w-5xl">
          <figure className="bg-rose-50 border border-rose-100 rounded-2xl shadow-md p-4">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open full-size Valentine’s pricing flyer"
            >
              <img src={src} alt={alt} className="w-full h-auto rounded-xl" />
            </a>

            <figcaption className="mt-4 flex flex-wrap gap-2 text-xs text-rose-700">
              <span className="rounded-full bg-white px-3 py-1 border border-rose-200">
                {validity}
              </span>
              <span className="rounded-full bg-white px-3 py-1 border border-rose-200">
                Valentine’s period • Feb 1 – Feb 28
              </span>
              <span className="rounded-full bg-white px-3 py-1 border border-rose-200">
                Peak evenings & weekends fill fast
              </span>
            </figcaption>
          </figure>
        </div>
      </section>
    </main>
  );
}
