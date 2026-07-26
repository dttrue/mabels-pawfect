// components/gallery/MemorialGridClient.jsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function MemorialGridClient({ memorials }) {
  const [selected, setSelected] = useState(null);

  const closeModal = () => setSelected(null);

  if (!memorials?.length) {
    return (
      <section className="bg-white px-4 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-gray-500">
            No memorials have been published yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {memorials.map((memorial, index) => (
            <button
              key={memorial.id}
              type="button"
              onClick={() => setSelected(memorial)}
              className="group overflow-hidden rounded-lg bg-white text-left shadow-md"
            >
              <div className="relative h-64 bg-gray-100">
                <Image
                  src={memorial.coverImage.imageUrl}
                  alt={
                    memorial.coverImage.altText ||
                    `${memorial.petName} memorial`
                  }
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={index === 0}
                />

                <div className="absolute inset-x-0 bottom-0 bg-black/50 p-3">
                  <div className="text-sm font-semibold text-white">
                    {memorial.petName}
                  </div>

                  {memorial.headline && (
                    <div className="mt-0.5 line-clamp-2 text-xs italic text-white/90">
                      {memorial.headline}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeModal}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-xl leading-none text-white"
              aria-label="Close memorial"
            >
              ×
            </button>

            <div className="relative aspect-[4/3] w-full bg-black">
              <Image
                src={selected.coverImage.imageUrl}
                alt={
                  selected.coverImage.altText || `${selected.petName} memorial`
                }
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 900px"
              />
            </div>

            <div className="p-5">
              <h3 className="text-xl font-semibold text-gray-900">
                {selected.petName}
              </h3>

              {(selected.birthYear || selected.passedYear) && (
                <p className="mt-1 text-sm text-gray-500">
                  {selected.birthYear || "—"} – {selected.passedYear || "—"}
                </p>
              )}

              {selected.headline && (
                <p className="mt-3 italic text-gray-700">{selected.headline}</p>
              )}

              {selected.story && (
                <p className="mt-4 line-clamp-5 whitespace-pre-line text-sm leading-6 text-gray-600">
                  {selected.story}
                </p>
              )}

              <Link
                href={`/memorials/${selected.slug}`}
                className="mt-5 inline-flex rounded-lg bg-pink-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-pink-700"
              >
                Read Full Memorial
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
