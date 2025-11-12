// app/api/whoami/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function GET() {
  const { userId, sessionId, getToken, sessionClaims } = auth();
  return NextResponse.json({
    userId: userId || null,
    sessionId: sessionId || null,
    email: sessionClaims?.email || null,
    env: process.env.NODE_ENV,
    keyPrefix: (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "").slice(
      0,
      7
    ),
  });
}
