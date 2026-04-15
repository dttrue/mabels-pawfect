// components/seasonal-pricing/PricingShell.jsx
"use client";

import Link from "next/link";

function formatDateRange(validFrom, validTo) {
  if (!validFrom && !validTo) return null;

  const format = (value) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  if (validFrom && validTo) return `${format(validFrom)} – ${format(validTo)}`;
  if (validFrom) return `Starts ${format(validFrom)}`;
  if (validTo) return `Ends ${format(validTo)}`;

  return null;
}

function getThemeClasses(theme = "default", isSeasonal = false) {
  if (!isSeasonal) {
    return {
      border: "border-stone-200",
      bg: "bg-white",
      button: "bg-stone-900 text-white hover:bg-stone-700",
    };
  }

  switch (theme) {
    case "easter":
      return {
        border: "border-amber-200",
        bg: "bg-gradient-to-br from-[#fff7ed] via-white to-[#fdf2f8]",
        button: "bg-amber-300 text-stone-900 hover:bg-amber-200",
      };

    case "holiday":
      return {
        border: "border-emerald-200",
        bg: "bg-gradient-to-br from-emerald-50 via-white to-rose-50",
        button: "bg-emerald-600 text-white hover:bg-emerald-500",
      };

    default:
      return {
        border: "border-stone-200",
        bg: "bg-white",
        button: "bg-stone-900 text-white hover:bg-stone-700",
      };
  }
}

export default function PricingShell({ image, bookingHref = "/booking" }) {
  const src = image?.imageUrl ?? null;
  const title = image?.title || "Pricing";
  const alt = image?.alt || "Pricing flyer showing services and rates.";
  const subtitle = image?.subtitle || "Standard pricing for services.";
  const badgeText = image?.badgeText || "Updated regularly";
  const ctaText = image?.ctaText || "Book Now";

  const isSeasonal = Boolean(image?.isSeasonal);
  const theme = image?.theme || "default";

  const dateRange = formatDateRange(image?.validFrom, image?.validTo);

  const classes = getThemeClasses(theme, isSeasonal);

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header
        className={`sticky top-0 z-20 border-b bg-white/90 backdrop-blur ${classes.border}`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-stone-900">{title}</h1>

          <div className="flex items-center gap-2">
            {src && (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-md px-3.5 py-2 text-sm font-semibold ${classes.button}`}
              >
                Open Flyer
              </a>
            )}

            <Link
              href={bookingHref}
              className="rounded-md border border-stone-300 px-3.5 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-50"
            >
              {ctaText}
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <figure
            className={`rounded-2xl border p-4 shadow-md ${classes.border} ${classes.bg}`}
          >
            {src ? (
              <img src={src} alt={alt} className="w-full rounded-xl" />
            ) : (
              <div className="flex h-64 items-center justify-center text-xs text-stone-600">
                Pricing flyer will appear here once uploaded.
              </div>
            )}

            <figcaption className="mt-4 flex flex-wrap gap-2 text-xs text-stone-800">
              <span className="rounded-full border px-3 py-1">{subtitle}</span>

              <span className="rounded-full border px-3 py-1">{badgeText}</span>

              {dateRange && (
                <span className="rounded-full border px-3 py-1">
                  {dateRange}
                </span>
              )}

              <span className="rounded-full border px-3 py-1">
                Evenings & weekends fill fast
              </span>
            </figcaption>
          </figure>
        </div>
      </section>
    </main>
  );
}
