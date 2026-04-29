import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";
import { getRoutePermissions } from "@/lib/menu";
import { User } from "@/modules/user/user.types";
import { userRepository } from "@/modules/user/user.repository";

const routePermissions = getRoutePermissions();

// 1. Specify protected and public routes
const publicRoutes = ["/login", "/api/auth/login", "/403"];

export default async function proxy(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  // Skip middleware for static assets and API auth routes
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api/auth") ||
    path.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // 3. Decrypt the session from the cookie
  let user: User | null = null;
  try {
    const cookie = req.cookies.get("session")?.value;
    if (cookie) {
      const decoded = (await decrypt(cookie)) as any;
      const userId = decoded.id || decoded.userId;
      if (userId) {
        // Fetch fresh user data from DB to ensure permissions are up to date
        user = (await userRepository.getUserById(Number(userId))) as User | null;
      }
    }
  } catch (error) {
    console.error("Failed to decrypt session or fetch user:", error);
  }

  // 4. Redirect to /login if the user is not authenticated
  if (!isPublicRoute && !user) {
    if (path.startsWith("/api")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // 5. Redirect to / if the user is authenticated and trying to access a public route
  if (isPublicRoute && user && path === "/login") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // 6. Permission check for authenticated users
  if (user && !isPublicRoute) {
    // Check for specific route permissions
    let requiredPermission: string | string[] | undefined =
      routePermissions[path];

    if (!requiredPermission) {
      // Check for prefix matches (e.g., /clients/1 matches /clients)
      const matchingBase = Object.keys(routePermissions).find(
        (route) => route !== "/" && path.startsWith(route),
      );
      if (matchingBase) {
        requiredPermission = routePermissions[matchingBase];
      }
    }

    if (requiredPermission) {
      const hasPermission = Array.isArray(requiredPermission)
        ? requiredPermission.some((p) => user.permissions?.includes(p) ?? false)
        : (user.permissions?.includes(requiredPermission as string) ?? false);

      if (!hasPermission) {
        // Forbidden
        if (path.startsWith("/api")) {
          return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/403", req.nextUrl));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.well-known).*)",
  ],
};
