import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Middleware for Role-Based Access Control ────────────────────
// In production, this would verify the Supabase session token
// and check the user's role from the database.
// For the demo, we use a simplified client-side approach.

// Routes that require ADMIN role
const adminOnlyPaths = [
  "/dashboard/paiements",
  "/dashboard/depenses",
  "/dashboard/relances",
  "/dashboard/parametres",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // In production with Supabase Auth:
  // 1. Verify the session cookie
  // 2. Check user role from profiles table
  // 3. Redirect unauthorized users

  // For now, the RBAC is handled client-side.
  // The middleware ensures basic route protection.

  // Redirect root to login or dashboard
  if (pathname === "/") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
