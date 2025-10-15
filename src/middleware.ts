import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const path = request.nextUrl.pathname;
  const sessionToken =
    request.cookies.get("next-auth.session-token") ??
    request.cookies.get("__Secure-next-auth.session-token") ??
    request.cookies.get("__Host-next-auth.session-token");
  const isLoggedIn = Boolean(sessionToken);

  if (path === "/presentation" || path.startsWith("/presentation/")) {
    const suffix = path.slice("/presentation".length);
    const targetPath = `/dashboard/slideshows${suffix}`;
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  // If user hits the landing page while authenticated, send them to the app
  if (isLoggedIn && path === "/") {
    return NextResponse.redirect(new URL("/dashboard/home", request.url));
  }

  // If user is on auth page but already signed in, redirect to home page
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard/home", request.url));
  }

  const isPublicPath = path === "/";

  // If user is not authenticated and trying to access a protected route, redirect to sign-in
  if (
    !isLoggedIn &&
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
