// components/pricing/Pricing.jsx
"use client";
import Link from "next/link";

export default function Pricing() {
  const src = "/images/seasonal-pricing/fall-2025.jpg";
  const validity = "Valid Sept 22 – Oct 26";
  const ooo = "Out of Office Oct 27–31 • Book early!";

  return (
    <main className="min-h-screen bg-[#0d0d0f] text-[#FFE8B0] relative overflow-x-hidden">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-gradient-to-r from-[#0d0d0f] via-[#15131b] to-[#0d0d0f]">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span aria-hidden>🎃</span>
            <span>Fall Pricing</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={src}
              download
              className="rounded-md bg-[#FF6A00] px-3.5 py-2 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-[#ff7d1f]"
            >
              Download Flyer
            </a>
            <Link
              href="/booking"
              className="rounded-md border border-white/15 px-3.5 py-2 text-sm font-semibold text-[#FFE8B0] hover:bg-white/5"
            >
              Book Now
            </Link>
          </div>
        </div>
      </header>

      {/* page-level floating accents */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <FloatingBits />
      </div>

      <section className="relative z-10">
        <div className="mx-auto max-w-5xl md:px-4 md:py-10">
          {/* full-bleed on mobile; framed card @ md+ */}
          <figure className="relative md:rounded-xl md:border md:border-white/10 md:bg-[#111317] md:p-3 md:shadow-sm md:overflow-hidden">
            {/* flyer + webs share this relative wrapper */}
            <div className="relative">
              {/* flyer (z-10) */}
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open full-size pricing flyer"
                className="block relative z-10"
              >
                <img
                  src={src}
                  alt="Mabel’s Pawfect — Fall pricing flyer (dog & cat care specials)."
                  className="w-full h-auto md:rounded-lg"
                />
              </a>

              {/* webs ON TOP of the flyer — desktop only (z-20) */}
              <div className="hidden md:block pointer-events-none absolute inset-0 z-20">
                <SvgWeb
                  className="absolute top-2 left-2 w-28 h-28 text-black/40 opacity-35
               mix-blend-multiply drop-shadow-[0_0_3px_rgba(255,255,255,.25)]"
                />
                <SvgWeb
                  className="absolute bottom-2 right-2 w-28 h-28 rotate-180 text-black/40 opacity-35
               mix-blend-multiply drop-shadow-[0_0_3px_rgba(255,255,255,.25)]"
                />
              </div>
            </div>

            {/* badges (z-30) */}
            <figcaption className="relative z-30 mx-0 md:mx-1 mt-3 flex flex-wrap gap-2 text-xs text-[#FFE8B0]/85">
              <span className="rounded-full bg-black/30 px-2 py-1 ring-1 ring-white/10">
                {validity}
              </span>
              <span className="rounded-full bg-black/30 px-2 py-1 ring-1 ring-white/10">
                {ooo}
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
              transform: translateX(10vw) translateY(-6px) rotate(5deg);
              opacity: 0.12;
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
    </main>
  );
}

/* ---------- SVG + bits ---------- */

function SvgWeb({ className = "" }) {
  const rings = [20, 40, 60, 80];
  const spokes = Array.from({ length: 12 }, (_, i) => i * 30);
  const rad = (d) => (d * Math.PI) / 180;
  const q = (n) => Number(n.toFixed(3));

  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.2" fill="none">
        {rings.map((r) => (
          <circle key={r} cx="0" cy="0" r={r} />
        ))}
        {spokes.map((deg) => {
          const x = q(100 * Math.cos(rad(deg)));
          const y = q(100 * Math.sin(rad(deg)));
          return <line key={`s-${deg}`} x1="0" y1="0" x2={x} y2={y} />;
        })}
        {rings.map((r) =>
          spokes.map((deg, i) => {
            const next = spokes[(i + 1) % spokes.length];
            const x1 = q(r * Math.cos(rad(deg)));
            const y1 = q(r * Math.sin(rad(deg)));
            const x2 = q(r * Math.cos(rad(next)));
            const y2 = q(r * Math.sin(rad(next)));
            return <line key={`${r}-${deg}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })
        )}
      </g>
    </svg>
  );
}

function FloatingBits() {
  return (
    <>
      <span className="absolute left-[8%] top-[22%] drift-1 text-2xl md:text-3xl opacity-[0.12] select-none">
        🦇
      </span>
      <span className="absolute right-[12%] top-[30%] drift-2 text-xl md:text-2xl opacity-[0.12] select-none">
        🍂
      </span>
      <span className="absolute left-[18%] bottom-[18%] drift-3 text-2xl md:text-3xl opacity-[0.12] select-none">
        🦇
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
