// components/shop/ProductImage.jsx

"use client";

import { CldImage } from "next-cloudinary";

export default function ProductImage({ publicId, alt }) {
  return (
    <CldImage
      src={publicId}
      width={600}
      height={600}
      alt={alt}
      className="rounded-2xl shadow-lg"
    />
  );
}
