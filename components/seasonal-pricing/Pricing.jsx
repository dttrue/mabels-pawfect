// components/seasonal-pricing/Pricing.jsx
"use client";

import Link from "next/link";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Pricing() {
  const imageKey = "pricing-flyer-main";

  const { data } = useSWR(
    imageKey
      ? `/api/admin/site-images?key=${encodeURIComponent(imageKey)}`
      : null,
    fetcher
  );

  const src = data?.image?.imageUrl ?? null;
  const alt =
    data?.image?.alt ||
    "Easter seasonal pet care pricing flyer for dog and cat care.";
  const validity =
    data?.image?.subtitle ||
    "Easter seasonal pricing (limited-time availability)";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b border-amber-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-stone-900">
            Easter Pricing 🐣
          </h1>

          <div className="flex items-center gap-2">
            {src && (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-amber-300 px-3.5 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-200"
              >
                Open Flyer
              </a>
            )}

            <Link
              href="/booking"
              className="rounded-md border border-stone-300 px-3.5 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-50"
            >
              Book Now
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="relative z-10 px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <figure className="rounded-2xl border border-amber-100 bg-gradient-to-br from-[#fff7ed] via-white to-[#fdf2f8] p-4 shadow-md">
            {src ? (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open full-size Easter seasonal pricing flyer"
              >
                <img src={src} alt={alt} className="h-auto w-full rounded-xl" />
              </a>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-amber-200 bg-white/60 text-xs text-stone-700">
                Easter pricing flyer will appear here once it’s uploaded in the
                admin.
              </div>
            )}

            <figcaption className="mt-4 flex flex-wrap gap-2 text-xs text-stone-800">
              <span className="rounded-full border border-amber-200 bg-white px-3 py-1">
                {validity}
              </span>
              <span className="rounded-full border border-amber-200 bg-white px-3 py-1">
                Easter period • Now – April 8
              </span>
              <span className="rounded-full border border-amber-200 bg-white px-3 py-1">
                Peak evenings & weekends fill fast
              </span>
            </figcaption>
          </figure>
        </div>
      </section>
    </main>
  );
}
