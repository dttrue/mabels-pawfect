// components/shop/ProductImageGallery.jsx
"use client";

import { useState } from "react";
import Image from "next/image";
import ZoomableImage from "@/components/common/ZoomableImage";

export default function ProductImageGallery({ images = [], productTitle }) {
  if (!images || images.length === 0) {
    return (
      <div className="bg-base-200 w-full aspect-square rounded-2xl flex items-center justify-center">
        <span className="opacity-60 text-sm">No image</span>
      </div>
    );
  }

  // sort defensively
  const sorted = [...images].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];

  // 👉 IMPORTANT: use the full Cloudinary URL here (NOT publicId)
  const activeSrc = active.url;

  if (!activeSrc) {
    // fallback if somehow url is missing
    return (
      <div className="bg-base-200 w-full aspect-square rounded-2xl flex items-center justify-center">
        <span className="opacity-60 text-sm">Image URL missing</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* MAIN IMAGE (tap/click to zoom via ZoomableImage) */}
      <ZoomableImage
        src={activeSrc}
        alt={active.alt || productTitle}
        width={800}
        height={800}
        className="w-full aspect-square rounded-2xl shadow-md object-cover bg-white"
      />

      {/* THUMBNAILS */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {sorted.map((img, index) => {
            const thumbSrc = img.url;

            if (!thumbSrc) return null;

            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border transition
                  ${
                    index === activeIndex
                      ? "border-primary shadow-md"
                      : "border-base-300 hover:border-primary/60"
                  }
                `}
                aria-label={`View image ${index + 1}`}
              >
                <Image
                  src={thumbSrc}
                  alt={img.alt || productTitle}
                  width={300}
                  height={300}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
