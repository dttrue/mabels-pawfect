// lib/adminApiClient.js
// Centralized admin key + fetch helper

const STORAGE_KEY = "ADMIN_SECRET"; // ✅ match old code
const HEADER_NAME = "x-admin-key"; // ✅ match old code
const QUERY_PARAM = "key"; // also send as ?key=... just in case

export function getAdminKey() {
  if (typeof window === "undefined") return "";

  let key = localStorage.getItem(STORAGE_KEY) || "";

  // Prompt once per browser if missing
  if (!key) {
    key = window.prompt("Enter admin key") || "";
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    }
  }

  return key;
}

export function clearAdminKey() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export async function adminApiFetch(path, options = {}) {
  const key = getAdminKey();

  // Attach key as query param (works with assertAdmin that reads searchParams)
  const url =
    key && typeof window !== "undefined"
      ? `${path}${path.includes("?") ? "&" : "?"}${QUERY_PARAM}=${encodeURIComponent(
          key
        )}`
      : path;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(key ? { [HEADER_NAME]: key } : {}),
    },
  });

  // Try to parse JSON, but don’t crash if it’s plain text
  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data ?? {};
}
