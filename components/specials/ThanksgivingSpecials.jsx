// components/specials/ThanksgivingSpecials.jsx
import Link from "next/link";
import Image from "next/image";

export default function ThanksgivingSpecials({
  title = "Thanksgiving Specials 🦃",
  subtitle = "Seasonal rates are live through Nov 30.",
  ctaHref = "/pricing-seasonal",
  ctaText = "See Holiday Pricing",
  imageSrc = "/images/seasonal-pricing/fall-thanksgiving-pricing-2025.jpg", // swap to your flyer
}) {
  return (
    <section
      aria-labelledby="thanksgiving-specials-heading"
      className="relative isolate mx-auto max-w-6xl px-4 py-12 md:py-16"
    >
      {/* background */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-[#3b1f0e] via-[#5a2e0f] to-[#3b1f0e] ring-1 ring-white/10 shadow-sm" />

      <div className="grid items-center gap-8 md:grid-cols-[1.1fr,0.9fr]">
        <div>
          <h2
            id="thanksgiving-specials-heading"
            className="text-2xl md:text-3xl font-semibold text-amber-100"
          >
            {title}
          </h2>
          <p className="mt-2 text-[13px] md:text-base text-amber-100/90 drop-shadow-[0_1px_0_rgba(0,0,0,.35)]">
            {subtitle}
          </p>

          {/* highlights */}
          <ul className="mt-6 space-y-3 text-amber-100">
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
              <span>Valid through Nov 30 — limited slots during peak days</span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-md bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-amber-300"
            >
              {ctaText}
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-amber-100 hover:bg-white/5"
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* flyer thumb */}
        <div className="relative">
          <div className="rounded-xl border border-white/10 bg-[#1b120a] p-2 shadow-sm">
            <Link href={ctaHref} aria-label="Open Thanksgiving pricing">
              <Image
                src={imageSrc}
                alt="Thanksgiving 2025 pricing flyer – dogs & cats"
                width={880}
                height={1360}
                className="h-auto w-full rounded-lg"
                priority
              />
            </Link>
          </div>
          {/* tiny corner accent */}
          <div className="pointer-events-none absolute -left-2 -top-2 h-8 w-8 rounded-full bg-amber-400/30 blur-md md:h-10 md:w-10" />
        </div>
      </div>
    </section>
  );
}
