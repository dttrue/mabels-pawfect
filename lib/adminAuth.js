// lib/adminAuth.js

import { auth } from "@clerk/nextjs/server";

export async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) {
    return {
      authorized: false,
      reason: "SIGNED_OUT",
      userId: null,
    };
  }

  const allowedAdminIds = new Set(
    (process.env.ADMIN_CLERK_USER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );

  const authorized = allowedAdminIds.has(userId);

  return {
    authorized,
    reason: authorized ? null : "NOT_ALLOWED",
    userId,
  };
}
