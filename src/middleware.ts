import { NextResponse, NextRequest } from "next/server";

const publicRoutes = new Set(["/sign-in", "/sign-up", "/"]);//routes that are accessible to all users
const authOnlyRoutes = new Set(["/sign-in", "/sign-up"]); // Routes only for unauthenticated users
const authRoutes = new Set(["/auth/success"]); // Routes that need special handling during auth flow
const mainRoutes=new Set(["/"])
export function middleware(req: NextRequest, res: NextResponse) {
  const { pathname } = req.nextUrl;
  const userToken = req.cookies.get("auth_token");

  // Skip middleware for API routes, static files, and auth flow routes
  if (pathname.startsWith("/api") || 
      pathname.startsWith("/_next") || 
      pathname.startsWith("/conversation") ||
      authRoutes.has(pathname)) {
    return NextResponse.next();
  }
  // Redirect authenticated users away from auth-only routes (sign-in, sign-up)
  if (authOnlyRoutes.has(pathname) && userToken) {
    return NextResponse.next();
  }
  if (mainRoutes.has(pathname) && userToken) {
    return NextResponse.redirect(new URL("/chat/new", req.url));
  }
  // Allow access to public routes (including home page)
  if (publicRoutes.has(pathname)) {
    return NextResponse.next();
  }

  // Check if user is authenticated for protected routes
  if (!userToken) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    "/",
    "/sign-in", 
    "/sign-up",
    "/chat/:path*",
    "/auth/:path*",
    "/settings"
  ],
};