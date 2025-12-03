// components/pricing/Pricing.jsx
"use client";
import Link from "next/link";
import SnowOverlay from "@/components/SnowOverlay"; 
export default function Pricing() {
  // ✅ Christmas flyer image
  const src = "/images/seasonal-pricing/christmas-pricing-2025.jpg";
  const validity = "Valid Dec 1 – Dec 31";

  return (
    <main className="min-h-screen bg-[#020f0a] text-emerald-50 relative overflow-x-hidden">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-gradient-to-r from-[#052016] via-[#073322] to-[#020f0a]">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span aria-hidden>🎄</span>
            <span>Christmas Pricing</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={src}
              download
              className="rounded-md bg-emerald-400 px-3.5 py-2 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-emerald-300"
            >
              Download Flyer
            </a>
            <Link
              href="/booking"
              className="rounded-md border border-emerald-50/25 px-3.5 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-50/5"
            >
              Book Now
            </Link>
          </div>
        </div>
      </header>

      {/* ❄️ Reusable Snow Component */}
      <SnowOverlay count={50} drift={true} />

      {/* page-level floating accents */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <FloatingBits />
      </div>

      <section className="relative z-10">
        <div className="mx-auto max-w-5xl md:px-4 md:py-10">
          {/* full-bleed on mobile; framed card @ md+ */}
          <figure className="relative md:rounded-xl md:border md:border-white/10 md:bg-[#041913] md:p-3 md:shadow-sm md:overflow-hidden">
            {/* flyer wrapper */}
            <div className="relative">
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open full-size Christmas pricing flyer"
                className="block relative z-10"
              >
                <img
                  src={src}
                  alt="Mabel’s Pawfect — Christmas pricing flyer (dog & cat care holiday specials)."
                  className="w-full h-auto md:rounded-lg"
                />
              </a>
            </div>

            {/* badges */}
            <figcaption className="relative z-30 mx-0 md:mx-1 mt-3 flex flex-wrap gap-2 text-xs text-emerald-50/90">
              <span className="rounded-full bg-black/30 px-2 py-1 ring-1 ring-white/10">
                {validity}
              </span>
              <span className="rounded-full bg-black/30 px-2 py-1 ring-1 ring-white/10">
                Seasonal rates • Limited peak-day slots
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* animations */}
      <style jsx>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes floatSlow {
            0% {
              transform: translateY(0) translateX(0) rotate(0deg);
            }
            50% {
              transform: translateY(-8px) translateX(4px) rotate(2deg);
            }
            100% {
              transform: translateY(0) translateX(0) rotate(0deg);
            }
          }
          @keyframes drift {
            0% {
              transform: translateX(-10vw) translateY(0) rotate(0deg);
              opacity: 0.08;
            }
            50% {
              transform: translateX(10vw) translateY(-6px) rotate(-5deg);
              opacity: 0.14;
            }
            100% {
              transform: translateX(-10vw) translateY(0) rotate(0deg);
              opacity: 0.08;
            }
          }
          .float-slow {
            animation: floatSlow 6s ease-in-out infinite;
          }
          .drift-1 {
            animation: drift 16s ease-in-out infinite;
          }
          .drift-2 {
            animation: drift 20s ease-in-out infinite reverse;
          }
          .drift-3 {
            animation: drift 18s ease-in-out infinite;
          }
        }
      `}</style>

      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) translateX(20px);
            opacity: 0.3;
          }
        }

        .animate-snowfall {
          animation-name: snowfall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </main>
  );
}

/* ---------- Seasonal bits (Christmas) ---------- */

function FloatingBits() {
  return (
    <>
      <span className="absolute left-[8%] top-[22%] drift-1 text-2xl md:text-3xl opacity-[0.12] select-none">
        🎄
      </span>
      <span className="absolute right-[12%] top-[30%] drift-2 text-xl md:text-2xl opacity-[0.12] select-none">
        🎁
      </span>
      <span className="absolute left-[18%] bottom-[18%] drift-3 text-2xl md:text-3xl opacity-[0.12] select-none">
        ❄️
      </span>
      <span className="absolute top-3 left-3 float-slow text-transparent">
        .
      </span>
      <span className="absolute bottom-3 right-3 float-slow text-transparent">
        .
      </span>
    </>
  );
}
