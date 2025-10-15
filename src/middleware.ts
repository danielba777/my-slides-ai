import { auth } from "@/server/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const path = request.nextUrl.pathname;

  if (path === "/presentation" || path.startsWith("/presentation/")) {
    const suffix = path.slice("/presentation".length);
    const targetPath = `/dashboard/presentation${suffix}`;
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  // If user hits the landing page while authenticated, send them to the app
  if (session && path === "/") {
    return NextResponse.redirect(new URL("/dashboard/home", request.url));
  }

  // If user is on auth page but already signed in, redirect to home page
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard/home", request.url));
  }

  const isPublicPath = path === "/";

  // If user is not authenticated and trying to access a protected route, redirect to sign-in
  if (
    !session &&
    !isAuthPage &&
    !isPublicPath &&
    !request.nextUrl.pathname.startsWith("/api")
  ) {
    return NextResponse.redirect(
      new URL(
        `/auth/signin?callbackUrl=${encodeURIComponent(request.url)}`,
        request.url,
      ),
    );
  }

  return NextResponse.next();
}

// Add routes that should be protected by authentication
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
