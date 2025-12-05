// components/common/ZoomableImage.jsx

"use client";

import { useState } from "react";
import Image from "next/image";

export default function ZoomableImage({ src, alt, width, height, className }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Thumbnail */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} cursor-zoom-in`}
        onClick={() => setOpen(true)}
      />

      {/* Simple custom modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setOpen(false)}
        >
          {/* Stop click from bubbling so clicking the image doesn't immediately close */}
          <div
            className="relative max-w-full max-h-[90vh] p-4 bg-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -top-2 -right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-700 shadow-md"
              aria-label="Close enlarged image"
            >
              ✕
            </button>

            <Image
              src={src}
              alt={alt}
              width={width * 1.5}
              height={height * 1.5}
              className="max-h-[80vh] w-auto rounded-xl shadow-lg cursor-zoom-out"
              onClick={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
