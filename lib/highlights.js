// lib/highlights.js
// lib/highlights.js
export function buildHlsUrl(publicId, version) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
  if (!cloud || !publicId) return null;
  const v = version ? `/v${version}` : "";
  return `https://res.cloudinary.com/${cloud}/video/upload${v}/sp_hd/${publicId}.m3u8`;
}


export function buildPoster(publicId, fallbackPosterUrl) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
  if (fallbackPosterUrl) return fallbackPosterUrl;
  if (!cloud || !publicId) return undefined;
  // frame at 2s
  return `https://res.cloudinary.com/${cloud}/video/upload/so_2/${publicId}.jpg`;
}
