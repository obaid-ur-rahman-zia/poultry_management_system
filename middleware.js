import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { roleBasedRoutes } from "./config/roles";

function isAuthorized(pathname, role) {
  if (!role) return false;

  for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
    if (
      pathname === route ||
      pathname.startsWith(route + "/")
    ) {
      return allowedRoles.includes(role);
    }
  }

  return true;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow API routes to pass through
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Define public routes - these should be accessible without authentication
  const publicRoutes = ["/auth/signin", "/unauthorized"];
  
  // Check if current path is a public route (handle both with and without locale)
  const pathWithoutLocale = pathname.replace(/^\/(en|ur|[a-z]{2})\//, "/");
  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(route + "/") ||
      pathWithoutLocale === route ||
      pathWithoutLocale.startsWith(route + "/")
  );

  try {
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET 
    });

    // If user is authenticated and tries to access signin, redirect to home
    if (token && pathname === "/auth/signin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Always allow public routes to pass through
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // If no token and not a public route, redirect to signin
    if (!token) {
      // Prevent redirect loop - don't set callbackUrl if it would be signin
      const callbackUrl = pathname === "/auth/signin" ? "/" : pathname;
      const signInUrl = new URL(`/auth/signin`, req.url);
      signInUrl.searchParams.set("callbackUrl", callbackUrl);
      return NextResponse.redirect(signInUrl);
    }

    // If user has token, check authorization
    if (token && !isAuthorized(pathname, token.role)) {
      return NextResponse.redirect(
        new URL(`/unauthorized`, req.url)
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, allow the request to proceed to avoid blocking the app
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next|.*\\..*|favicon.ico|images|robots.txt).*)",
  ],
};
