// middleware.js
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// .env: ADMIN_USER_IDS=user_xxx,user_yyy
const ADMIN_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Dev convenience switch (do NOT enable in production)
const DEV_BYPASS = process.env.ADMIN_DEV_BYPASS === "1";

export default clerkMiddleware((auth, req) => {
  // Only guard /admin routes
  if (!isAdminRoute(req)) return NextResponse.next();

  // If bypass flag is on, let requests through (use only in local/dev)
  if (DEV_BYPASS) return NextResponse.next();

  // Otherwise require an allowed Clerk userId
  const { userId } = auth(); // sync accessor

  if (!userId) {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }

  if (ADMIN_IDS.includes(userId)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/not-authorized", req.url));
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
