// utils/cldUrl.js
export function cldUrl(
  pubIdOrUrl,
  cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD
) {
  if (!pubIdOrUrl) return "";
  if (/^https?:\/\//i.test(pubIdOrUrl)) return pubIdOrUrl; // already a URL
  const safe = encodeURI(pubIdOrUrl); // keep slashes, escape spaces etc.
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto/${safe}`;
}
