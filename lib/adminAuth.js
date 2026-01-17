// lib/adminAuth.js
export function assertAdmin(req) {
  const secret = process.env.ADMIN_SECRET || "";

  // Allow either header or query param
  const headerKey = req.headers.get("x-admin-key") || "";
  const url = new URL(req.url);
  const queryKey = url.searchParams.get("key") || "";

  const key = headerKey || queryKey;

  if (!secret) {
    return { ok: false, reason: "ADMIN_SECRET not set" };
  }

  if (key !== secret) {
    return { ok: false, reason: "Unauthorized" };
  }

  return { ok: true };
}
