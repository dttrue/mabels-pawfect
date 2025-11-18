// components/HappyPetsGrid.jsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { trackGalleryImageOpen } from "@/lib/ga-events";

export default function HappyPetsGrid() {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("/api/admin/gallery")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (img) => img.category === "HAPPY" && !img.deletedAt
        );
        setImages(filtered);
      })
      .catch((err) => {
        console.error("Failed to fetch gallery:", err);
      });
  }, []);

  const openModal = (image, index) => {
    // 🔥 send detailed event to GA
    trackGalleryImageOpen({
      imageId: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText,
      index,
    });

    setSelected(image);
  };

  const closeModal = () => setSelected(null);

  return (
    <section className="bg-pinky-50 py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => openModal(image, index)}
              className="relative h-64 overflow-hidden rounded-lg shadow-md cursor-pointer"
            >
              <Image
                src={image.imageUrl}
                alt={image.altText || "Happy pet"}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105 rounded-lg"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
              />
            </button>
          ))}
        </div>
      </div>

      {/* ✅ Simple fullscreen modal for the selected image */}
      {selected && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center"
          onClick={closeModal} // click backdrop to close
        >
          <div
            className="relative max-w-2xl w-full p-4"
            onClick={(e) => e.stopPropagation()} // don't close when clicking the image
          >
            {/* Close button */}
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none"
              aria-label="Close image"
            >
              ×
            </button>

            <Image
              src={selected.imageUrl}
              alt={selected.altText || "Happy pet"}
              width={1200}
              height={800}
              className="rounded-lg shadow-lg mx-auto"
            />
          </div>
        </div>
      )}
    </section>
  );
}
