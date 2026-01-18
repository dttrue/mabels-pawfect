// lib/adminAuth.js

export function assertAdmin(req) {
  const headerKey = req.headers.get("x-admin-key");
  const urlKey = req.nextUrl?.searchParams?.get("key");

  const incoming = (headerKey || urlKey || "").trim();
  const expected = (process.env.ADMIN_SECRET || "").trim();

  if (!expected) {
    console.error("ADMIN_SECRET is not set on the server");
    return { ok: false, reason: "server-misconfig" };
  }

  if (!incoming || incoming !== expected) {
    return { ok: false, reason: "unauthorized" };
  }

  return { ok: true };
}
