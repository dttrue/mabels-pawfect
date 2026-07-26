// lib/adminAuth.js

import { auth } from "@clerk/nextjs/server";

export async function requireAdmin() {
  const { userId } = await auth();

  console.log("Authenticated Clerk user:", userId);

  const allowedAdminIds = new Set(
    (process.env.ADMIN_CLERK_USER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );

  console.log("Allowed admins:", [...allowedAdminIds]);

  return {
    authorized: userId && allowedAdminIds.has(userId),
    reason: !userId
      ? "SIGNED_OUT"
      : allowedAdminIds.has(userId)
        ? null
        : "NOT_ALLOWED",
    userId,
  };
}