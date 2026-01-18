// middleware.js
// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// export default clerkMiddleware((auth, req) => {
//   // Only guard /admin
//   if (!isAdminRoute(req)) return NextResponse.next();

//   // Require sign-in, but no allowlist
//   const { userId } = auth();
//   if (!userId) {
//     const url = new URL("/sign-in", req.url);
//     url.searchParams.set(
//       "redirect_url",
//       req.nextUrl.pathname + req.nextUrl.search
//     );
//     return NextResponse.redirect(url);
//   }

//   // Signed-in? Let them through.
//   return NextResponse.next();
// });

// // Scope the middleware to /admin only
// export const config = {
//   matcher: ["/admin/:path*"],
// };

// middleware.js
// middleware.js
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // ✅ protect admin UI with Clerk
    "/admin/:path*",

    // ❌ DO NOT protect admin API here
    // "/api/admin/:path*",
  ],
};

