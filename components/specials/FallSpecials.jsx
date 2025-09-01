// components/specials/FallSpecials.jsx
import Link from "next/link";
import Image from "next/image";

export default function FallSpecials({
  title = "Fall Specials 🍂",
  subtitle = "Seasonal rates are live through Oct 26. Out of office Oct 27–31 — book early!",
  ctaHref = "/pricing-seasonal",
  ctaText = "See Fall Pricing",
  imageSrc = "/images/seasonal-pricing/fall-2025.jpg", // Bridget’s flyer (thumbnail)
}) {
  return (
    <section
      aria-labelledby="fall-specials-heading"
      className="relative isolate mx-auto max-w-6xl px-4 py-12 md:py-16"
    >
      {/* background */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-[#0d0d0f] via-[#15131b] to-[#0d0d0f] ring-1 ring-white/10 shadow-sm" />

      <div className="grid items-center gap-8 md:grid-cols-[1.1fr,0.9fr]">
        <div>
          <h2
            id="fall-specials-heading"
            className="text-2xl md:text-3xl font-semibold text-[#FFE8B0]"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm md:text-base text-[#FFE8B0]/85">
            {subtitle}
          </p>

          {/* quick highlights – kept general so we never drift from the flyer */}
          <ul className="mt-6 space-y-3 text-[#FFE8B0]">
            <li className="flex items-start gap-2">
              <span aria-hidden>🦴</span>
              <span>Drop-ins for dogs & cats • 15/30/60 minute options</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>🛁</span>
              <span>Add-ons: at-home bath, nail trim, transport (inquire)</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>📅</span>
              <span>Valid through Oct 26 — limited slots during peak days</span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-md bg-[#FF6A00] px-4 py-2.5 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-[#ff7d1f]"
            >
              {ctaText}
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-[#FFE8B0] hover:bg-white/5"
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* flyer thumb */}
        <div className="relative">
          <div className="rounded-xl border border-white/10 bg-[#111317] p-2 shadow-sm">
            <Link href={ctaHref} aria-label="Open fall pricing">
              <Image
                src={imageSrc}
                alt="Fall 2025 pricing flyer – dogs & cats"
                width={880}
                height={1360}
                className="h-auto w-full rounded-lg"
                priority
              />
            </Link>
          </div>
          {/* tiny corner accent */}
          <div className="pointer-events-none absolute -left-2 -top-2 h-8 w-8 rounded-full bg-[#FF6A00]/30 blur-md md:h-10 md:w-10" />
        </div>
      </div>
    </section>
  );
}
