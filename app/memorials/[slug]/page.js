// app/memorials/[slug]/page.js

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const memorial = await prisma.petMemorial.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      deletedAt: null,
    },
    select: {
      petName: true,
      headline: true,
    },
  });

  if (!memorial) {
    return {
      title: "Memorial Not Found | Mabel's Pawfect",
    };
  }

  return {
    title: `${memorial.petName} Memorial | Mabel's Pawfect`,
    description:
      memorial.headline ||
      `A loving memorial created in honor of ${memorial.petName}.`,
  };
}

export default async function MemorialDetailPage({ params }) {
  const { slug } = await params;

  const memorial = await prisma.petMemorial.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      deletedAt: null,
    },
    select: {
      id: true,
      petName: true,
      petType: true,
      breed: true,
      birthYear: true,
      passedYear: true,
      headline: true,
      story: true,
      favoriteThings: true,
      closingMessage: true,
      publishedAt: true,
      images: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          imageUrl: true,
          altText: true,
          caption: true,
          isCover: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!memorial) {
    notFound();
  }

  const coverImage =
    memorial.images.find((image) => image.isCover) || memorial.images[0];

  const remainingImages = coverImage
    ? memorial.images.filter((image) => image.id !== coverImage.id)
    : memorial.images;

  const lifeYears =
    memorial.birthYear || memorial.passedYear
      ? `${memorial.birthYear || "—"} – ${memorial.passedYear || "—"}`
      : null;

  return (
    <main className="min-h-screen bg-[#fff9ee] px-4 py-12 sm:py-16">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-xl">
        {coverImage && (
          <div className="relative aspect-[16/10] w-full bg-gray-100">
            <Image
              src={coverImage.imageUrl}
              alt={
                coverImage.altText || `${memorial.petName} memorial photograph`
              }
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        )}

        <div className="px-5 py-8 sm:px-10 sm:py-12">
          <header className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              In Loving Memory
            </p>

            <h1 className="mt-3 text-4xl font-semibold text-gray-900">
              {memorial.petName}
            </h1>

            {lifeYears && (
              <p className="mt-2 text-sm text-gray-500">{lifeYears}</p>
            )}

            {(memorial.breed || memorial.petType) && (
              <p className="mt-2 text-sm text-gray-500">
                {[memorial.breed, memorial.petType].filter(Boolean).join(" · ")}
              </p>
            )}

            {memorial.headline && (
              <p className="mx-auto mt-6 max-w-2xl text-xl italic leading-8 text-gray-700">
                {memorial.headline}
              </p>
            )}
          </header>

          {memorial.story && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold text-gray-900">
                Their Story
              </h2>

              <p className="mt-3 whitespace-pre-line text-base leading-8 text-gray-700">
                {memorial.story}
              </p>
            </section>
          )}

          {remainingImages.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold text-gray-900">
                Cherished Memories
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {remainingImages.map((image) => (
                  <figure
                    key={image.id}
                    className="overflow-hidden rounded-xl bg-gray-100"
                  >
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={image.imageUrl}
                        alt={
                          image.altText ||
                          `${memorial.petName} memorial photograph`
                        }
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </div>

                    {image.caption && (
                      <figcaption className="px-4 py-3 text-sm italic text-gray-600">
                        {image.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {memorial.favoriteThings && (
            <section className="mt-10 rounded-xl bg-pink-50 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Favorite Things
              </h2>

              <p className="mt-2 whitespace-pre-line leading-7 text-gray-700">
                {memorial.favoriteThings}
              </p>
            </section>
          )}

          {memorial.closingMessage && (
            <section className="mt-10 border-t border-gray-200 pt-8 text-center">
              <p className="mx-auto max-w-2xl whitespace-pre-line text-lg italic leading-8 text-gray-700">
                {memorial.closingMessage}
              </p>
            </section>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/gallery/memoriam"
              className="inline-flex rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back to Memorial Gallery
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
