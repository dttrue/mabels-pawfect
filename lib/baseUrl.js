// lib/baseUrl.js
import { headers } from "next/headers";

export function getBaseUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL; // ✅ supports either

  if (explicit) return explicit.replace(/\/+$/, "");

  // Fallback for local/dev and previews
  const host = headers().get("host") || "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}
