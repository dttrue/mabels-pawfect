// components/gallery/MemoriamGridClient.jsx
"use client";

import { useState } from "react";
import Image from "next/image";

export default function MemorialGridClient({ memorials }) {
  const [selected, setSelected] = useState(null);

  const openModal = (pet) => setSelected(pet);
  const closeModal = () => setSelected(null);

  if (!memorials?.length) return null;

  return (
    <section className="bg-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 text-center">
          In Loving Memory
        </h2>
        <p className="mt-2 text-sm text-gray-600 text-center">
          A tribute to the pets we’ll always remember.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {memorials.map((pet, index) => (
            <button
              key={pet.id}
              type="button"
              onClick={() => openModal(pet)}
              className="relative h-64 overflow-hidden rounded-lg shadow-md cursor-pointer bg-gray-100"
            >
              <Image
                src={pet.imageUrl}
                alt={pet.altText || pet.caption || "Memorial pet"}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
              />

              {/* soft overlay label */}
              <div className="absolute inset-x-0 bottom-0 bg-black/45 p-3 text-left">
                <div className="text-sm font-semibold text-white line-clamp-1">
                  {pet.altText || "A Beloved Friend"}
                </div>
                {pet.caption && (
                  <div className="mt-0.5 text-xs text-white/90 italic line-clamp-2">
                    {pet.caption}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="relative max-w-3xl w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none"
              aria-label="Close image"
            >
              ×
            </button>

            <div className="bg-white rounded-lg overflow-hidden">
              <div className="relative w-full aspect-[4/3] bg-black">
                <Image
                  src={selected.imageUrl}
                  alt={selected.altText || selected.caption || "Memorial pet"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 900px"
                />
              </div>

              <div className="p-4">
                <div className="text-lg font-semibold text-gray-900">
                  {selected.altText || "A Beloved Friend"}
                </div>
                {selected.caption && (
                  <p className="mt-1 text-sm text-gray-700 italic">
                    {selected.caption}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
