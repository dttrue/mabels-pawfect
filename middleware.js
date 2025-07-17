// middleware.js
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const allowedIds = [
  "user_2xYcBxcVUeYD9RmUOhCdEErW4ef", // Daniel
  "user_2xbPOkF9DIJJQFVuQk0QbjBw5bC", // Bridget
];

export default clerkMiddleware(async (auth, req) => {
  if (!isAdminRoute(req)) return;

  const { userId } = await auth(); // Await the auth object

  console.log("🪪 Clerk Middleware User ID:", userId);
  console.log("🧪 allowedIds:", allowedIds);
  console.log("🧪 Match found?", allowedIds.includes(userId));

  if (!allowedIds.includes(userId)) {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }
});




export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};


