// components/price/PricingPage.jsx
"use client";

import Image from "next/image";
import priceListImg from "@/public/images/seasonal-pricing/christmas-pricing-2025.jpg";
import SnowOverlay from "@/components/SnowOverlay";

export const metadata = {
  title: "🎄 Holiday Pet Care Pricing | Mabel's Pawfect Pet Services",
  description:
    "Holiday pet care pricing flyer for dogs and cats. Drop-ins, walking, baths, nail trims, and transport.",
};

export default function PricePage() {
  const src = "/images/christmas-pricing-2025.jpg"; // download path
  const validity = "Valid Dec 1 – Dec 31";

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#020f0a] text-emerald-50">
      {/* Winter gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#04151a] via-[#020f0a] to-black" />

      {/* ❄️ Snow overlay */}
      <SnowOverlay count={40} drift />

      {/* ❄️ Snow pile at bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 md:h-24 bg-gradient-to-t from-white/85 via-white/50 to-transparent" />

      <div className="relative z-20 mx-auto max-w-5xl px-4 py-10">
        {/* Banner */}
        <div className="mx-auto mb-6 w-fit rounded-full bg-emerald-500/90 px-5 py-2 text-sm font-semibold text-black shadow-md">
          🎄 Holiday Pricing • Dec 1–31
        </div>

        {/* Flyer */}
        <div className="mx-auto max-w-3xl rounded-xl bg-black/30 p-3 shadow-xl backdrop-blur">
          <Image
            src={priceListImg}
            alt="Mabel’s Pawfect Pet Services — Holiday pet care pricing flyer"
            className="rounded-lg w-full h-auto"
            priority
          />
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => window.print()}
            className="rounded-full bg-emerald-400 px-5 py-2 text-white shadow hover:bg-emerald-300 active:scale-[0.99]"
          >
            🖨️ Print Flyer
          </button>

          <a
            href={src}
            download
            className="rounded-full bg-emerald-200 px-5 py-2 text-emerald-900 shadow hover:bg-emerald-300 active:scale-[0.99]"
          >
            ⬇️ Download JPG
          </a>

          <a
            href="/booking"
            className="rounded-full bg-rose-500 px-5 py-2 text-white shadow hover:bg-rose-400 active:scale-[0.99]"
          >
            📅 Book a Holiday Visit
          </a>
        </div>

        {/* Footnote */}
        <p className="mt-4 text-center text-sm text-emerald-50/80">
          Holiday rates apply December 1–31. Additional fees may apply for peak
          dates.
        </p>
      </div>
    </section>
  );
}
