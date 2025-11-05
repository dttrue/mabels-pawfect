import { headers } from "next/headers";

export function getBaseUrl() {
  // Prefer explicit env if you set it
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env) return env.replace(/\/+$/, "");

  // Derive from the incoming request (SSR-safe)
  const host = headers().get("host") || "localhost:3000";
  const isLocal = host.includes("localhost") || host.startsWith("127.");
  const proto = isLocal ? "http" : "https";
  return `${proto}://${host}`;
}
