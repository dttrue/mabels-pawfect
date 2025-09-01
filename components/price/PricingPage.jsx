// components/price/PricingPage.jsx
"use client";

import Image from "next/image";
import priceListImg from "@/public/images/pet-care-price-list.jpg"; // put the JPG here

export const metadata = {
  title: "🍂 Pet Care Price List | Mabel's Pawfect Pet Services",
  description:
    "Seasonal pet care pricing flyer for dogs and cats. Drop-ins, walking, baths, nail trims, and transport.",
};

export default function PricePage() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Cozy fall gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50 via-amber-100 to-orange-200" />

      {/* Falling leaves (pure SVG + CSS) */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <Leaf key={i} delay={i * 0.6} left={`${(i * 8) % 100}%`} />
        ))}
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-10">
        {/* Banner */}
        <div className="mx-auto mb-6 w-fit rounded-full bg-orange-600/90 px-5 py-2 text-sm font-semibold text-white shadow-md">
          🍁 Now booking Fall drop-ins & walks!
        </div>

        {/* Flyer */}
        <div className="mx-auto max-w-3xl rounded-xl bg-white/60 p-3 shadow-xl backdrop-blur">
          <Image
            src={priceListImg}
            alt="Pet Care Price List — Fall specials, dog & cat care"
            className="rounded-lg w-full h-auto"
            priority
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => window.print()}
            className="rounded-full bg-orange-700 px-5 py-2 text-white shadow hover:bg-orange-800 active:scale-[0.99]"
          >
            🖨️ Print Flyer
          </button>
          <a
            href="/images/pet-care-price-list.jpg"
            download
            className="rounded-full bg-amber-500 px-5 py-2 text-amber-950 shadow hover:bg-amber-600 active:scale-[0.99]"
          >
            ⬇️ Download JPG
          </a>
          <a
            href="/booking"
            className="rounded-full bg-emerald-600 px-5 py-2 text-white shadow hover:bg-emerald-700 active:scale-[0.99]"
          >
            📅 Book a Visit
          </a>
        </div>

        {/* Footnote */}
        <p className="mt-4 text-center text-sm text-orange-900/80">
          Rates reflect seasonal pricing. Additional fees may apply for
          holidays, travel, or special care.
        </p>
      </div>

      {/* Local styles for leaf animation */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0.8;
          }
        }
      `}</style>
    </section>
  );
}

function Leaf({ delay = 0, left = "50%" }) {
  // Simple SVG leaf; duplicated with different delays/positions
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      className="absolute"
      style={{
        left,
        animation: `fall 12s linear ${delay}s infinite`,
        filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.1))",
      }}
    >
      <path
        d="M12 2c3 1 6 3 7 6 1 3-1 7-4 9s-7 2-9-1c-3-3-2-8 2-11 1-1 3-2 4-3Z"
        fill="#ea580c"
      />
      <path
        d="M12 3c-1 5 1 10 6 12"
        stroke="#7c2d12"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
