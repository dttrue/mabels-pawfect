// components/shop/ProductImageGallery.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ZoomableImage from "@/components/common/ZoomableImage";

function getImageKey(image) {
  if (typeof image?.id === "string" && image.id) return `id:${image.id}`;
  if (typeof image?.url === "string" && image.url) {
    return `url:${image.url}`;
  }
  return null;
}

function hasUsableImageUrl(image) {
  return typeof image?.url === "string" && image.url.trim().length > 0;
}

export default function ProductImageGallery({ images = [], productTitle }) {
  const hasProvidedImages = Array.isArray(images) && images.some(Boolean);

  // sort defensively
  const sorted = useMemo(
    () =>
      (Array.isArray(images) ? images.filter(hasUsableImageUrl) : []).sort(
        (a, b) => (a.sort ?? 0) - (b.sort ?? 0)
      ),
    [images]
  );

  const [selectedImageKey, setSelectedImageKey] = useState(null);
  const selectedIndex =
    selectedImageKey === null
      ? -1
      : sorted.findIndex((image) => getImageKey(image) === selectedImageKey);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const active = sorted[activeIndex] ?? null;

  useEffect(() => {
    if (selectedImageKey !== null && selectedIndex < 0) {
      setSelectedImageKey(null);
    }
  }, [selectedImageKey, selectedIndex]);

  if (sorted.length === 0) {
    return (
      <div className="bg-base-200 w-full aspect-square rounded-2xl flex items-center justify-center">
        <span className="opacity-60 text-sm">
          {hasProvidedImages ? "Image URL missing" : "No image"}
        </span>
      </div>
    );
  }

  // 👉 IMPORTANT: use the full Cloudinary URL here (NOT publicId)
  const activeSrc = active.url;

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
                key={getImageKey(img) ?? index}
                type="button"
                onClick={() => setSelectedImageKey(getImageKey(img))}
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
