import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

// 1. Specify protected and public routes
const publicRoutes = ["/login", "/api/auth/login"];

export default async function proxy(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Decrypt the session from the cookie
  let session = null;
  try {
    const cookie = req.cookies.get("session")?.value;
    if (cookie) {
      session = await decrypt(cookie);
    }
  } catch (error) {
    console.error("Failed to decrypt session:", error);
  }

  // 4. Redirect to /login if the user is not authenticated
  if (!isPublicRoute && !session) {
    if (path.startsWith("/api")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // 5. Redirect to / if the user is authenticated and trying to access a public route
  if (isPublicRoute && session && !path.startsWith("/api")) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.well-known).*)",
  ],
};
