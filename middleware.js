// middleware.js
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// .env.local: ADMIN_USER_IDS=user_xxx,user_yyy
const ADMIN_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const DEV_BYPASS = process.env.ADMIN_DEV_BYPASS === "1";

export default clerkMiddleware((auth, req) => {
  if (!isAdminRoute(req)) return;

  if (DEV_BYPASS && process.env.NODE_ENV !== "production") return;

  const { userId } = auth(); // no await
  // TEMP LOGS
  console.log("🪪 userId:", userId, "ADMIN_IDS:", ADMIN_IDS);
  console.log("🧪 ENV ADMIN_USER_IDS:", process.env.ADMIN_USER_IDS);
  console.log("🪪 Current userId:", userId);
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }
});

export const config = {
  matcher: [
    // same as yours
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
