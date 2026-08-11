// app/foster-cats/page.js

import Link from "next/link";
import { getPublicFosterCats } from "@/lib/publicFosterCats";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meet Our Rescue Cats | Mabel’s Pawfect Pet Services",
  description:
    "Meet the cats receiving rescue care and learn how your donations help provide food, litter, enrichment, and medical support.",
};

function formatCurrency(cents) {
  if (!Number.isInteger(cents)) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function calculateProgress(raisedCents, goalCents) {
  if (
    !Number.isInteger(raisedCents) ||
    !Number.isInteger(goalCents) ||
    goalCents <= 0
  ) {
    return null;
  }

  return Math.min(
    100,
    Math.max(0, Math.round((raisedCents / goalCents) * 100))
  );
}

export default async function FosterCatsPage() {
  const cats = await getPublicFosterCats();

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white px-4 py-12 md:py-16">
      <section className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-700">
            Foster Cat Program
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">
            Meet Our Rescue Cats
          </h1>

          <p className="mt-5 text-lg leading-8 text-gray-600">
            These cats are receiving food, shelter, enrichment, and medical
            support while they prepare for loving permanent homes.
          </p>

          <p className="mt-3 text-gray-600">
            You can support the general rescue fund or direct your donation
            toward a specific foster cat.
          </p>
        </div>

        {cats.length === 0 ? (
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-pink-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">
              No Foster Cats Are Listed Right Now
            </h2>

            <p className="mt-3 text-gray-600">
              Our foster list changes as cats receive care and find permanent
              homes. General rescue donations still help us prepare for the next
              animal in need.
            </p>

            <Link
              href="/donations"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
            >
              Support the Rescue Fund
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {cats.map((cat) => {
              const progress = calculateProgress(
                cat.raisedCents,
                cat.goalCents
              );

              return (
                <article
                  key={cat.id}
                  className="flex overflow-hidden rounded-2xl border border-pink-200 bg-white shadow-sm"
                >
                  <div className="flex w-full flex-col">
                    <img
                      src={cat.imageUrl}
                      alt={cat.imageAlt || cat.name}
                      className="aspect-square w-full object-cover"
                    />

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            {cat.name}
                          </h2>

                          {(cat.ageLabel || cat.sex) && (
                            <p className="mt-1 text-sm text-gray-500">
                              {[cat.ageLabel, cat.sex]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="mt-4 leading-7 text-gray-600">
                        {cat.shortBio}
                      </p>

                      {cat.careNeeds && (
                        <div className="mt-5 rounded-xl bg-pink-50 p-4">
                          <h3 className="text-sm font-semibold text-pink-900">
                            Current care needs
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-pink-900/75">
                            {cat.careNeeds}
                          </p>
                        </div>
                      )}

                      {progress !== null && (
                        <div className="mt-6">
                          <div className="flex justify-between gap-4 text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(cat.raisedCents)} raised
                            </span>

                            <span className="text-gray-500">
                              {formatCurrency(cat.goalCents)} goal
                            </span>
                          </div>

                          <div
                            className="mt-2 h-2 overflow-hidden rounded-full bg-pink-100"
                            role="progressbar"
                            aria-label={`${cat.name} fundraising progress`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progress}
                          >
                            <div
                              className="h-full rounded-full bg-pink-600"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-auto pt-6">
                        <Link
                          href={`/donations?fosterCat=${encodeURIComponent(
                            cat.id
                          )}`}
                          className="inline-flex w-full items-center justify-center rounded-lg bg-pink-600 px-5 py-3 font-semibold text-white transition hover:bg-pink-700"
                        >
                          Support {cat.name}
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-14 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Support Wherever It Is Needed Most
          </h2>

          <p className="mx-auto mt-3 max-w-2xl leading-7 text-gray-600">
            General rescue donations help cover food, litter, enrichment,
            medical care, transportation, and supplies across the foster
            program.
          </p>

          <Link
            href="/donations"
            className="mt-6 inline-flex items-center justify-center rounded-lg border border-pink-600 px-6 py-3 font-semibold text-pink-700 transition hover:bg-pink-50"
          >
            Donate to the General Fund
          </Link>
        </div>
      </section>
    </main>
  );
}
