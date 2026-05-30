// Clerk auth proxy. Next.js 16 renamed the `middleware.ts` file convention
// to `proxy.ts`; the function exported from `@clerk/nextjs/server` is still
// called `clerkMiddleware()` (that's a Clerk export, not a Next convention).
//
// Runs on every matched request and attaches the Clerk auth context so
// server components and route handlers can call `await auth()` from
// `@clerk/nextjs/server`.
//
// This file uses `clerkMiddleware()` with no protect/redirect logic — every
// route stays publicly accessible for now. When we're ready to gate routes
// (e.g. /chat requires sign-in), wrap with `createRouteMatcher` and call
// `auth.protect()` inside the callback.
//
// Matcher rules:
//   1. Run on every page route except Next.js internals + static assets.
//   2. Always run for API/TRPC routes.
//   3. Always run for Clerk's own auto-proxy path (`/__clerk/(.*)`) — Clerk
//      uses this to proxy auth flows through the app's origin instead of
//      the Clerk domain. Required even though we don't host any /__clerk
//      routes ourselves.

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/chat(.*)',
  '/api/generate-design(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files (unless query string forces it)
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API + TRPC routes
    "/(api|trpc)(.*)",
    // Clerk auto-proxy path (required even without explicit routes)
    "/__clerk/(.*)",
  ],
};
