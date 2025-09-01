// components/AnnouncementBlock.jsx
import Link from "next/link";
import Image from "next/image";

export default function AnnouncementBlock({
  title = "Fall Digital Postcard 🍁",
  body = "Share our seasonal postcard with friends — and check out special rates through Oct 26.",
  imageSrc = "/images/postcards/fall-2025.jpg", // put your postcard here
  ctaHref = "/pricing",
  ctaText = "View Pricing",
  secondaryHref = "/gallery",
  secondaryText = "See More Photos",
}) {
  return (
    <section
      aria-labelledby="announcement-heading"
      className="mx-auto max-w-6xl px-4 py-12"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d0f]">
        <div className="grid gap-0 md:grid-cols-2">
          {/* image */}
          <div className="relative">
            <Image
              src={imageSrc}
              alt="Seasonal postcard"
              width={1200}
              height={900}
              className="h-full w-full object-cover"
              priority
            />
            {/* soft vignette */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
          </div>

          {/* copy */}
          <div className="relative p-6 md:p-8">
            <h3
              id="announcement-heading"
              className="text-xl md:text-2xl font-semibold text-[#FFE8B0]"
            >
              {title}
            </h3>
            <p className="mt-2 text-[#FFE8B0]/85">{body}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center rounded-md bg-[#FF6A00] px-4 py-2.5 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-[#ff7d1f]"
              >
                {ctaText}
              </Link>
              {secondaryHref && secondaryText ? (
                <Link
                  href={secondaryHref}
                  className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-[#FFE8B0] hover:bg-white/5"
                >
                  {secondaryText}
                </Link>
              ) : null}
            </div>

            {/* subtle confetti/stars */}
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-24 w-24 rounded-full bg-[#FF6A00]/20 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
