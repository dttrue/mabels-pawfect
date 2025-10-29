// lib/cld.js
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
const BASE = `https://res.cloudinary.com/${CLOUD}/image/upload`;

export function cld(
  publicId,
  { w = 1200, h = 900, crop = "fill", gravity = "auto" } = {}
) {
  return `${BASE}/f_auto,q_auto,c_${crop},g_${gravity},w_${w},h_${h}/${publicId}.jpg`;
}

