// middleware.js

import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Run Clerk on application routes, excluding Next internals
    // and ordinary static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",

    // Always run Clerk on API routes.
    "/(api|trpc)(.*)",

    // Always run Clerk frontend API routes.
    "/__clerk/(.*)",
  ],
};
