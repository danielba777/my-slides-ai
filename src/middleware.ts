import { auth } from "@/server/auth";
import { env } from "@/env";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const path = request.nextUrl.pathname;
  const isAdminPath = path.startsWith("/admin");

  // --- Allowlist for crawlers/static machine-readable files ---
  // Make sitemap & robots always public and bypass any auth redirects.
  // Handles both GET and HEAD correctly so Content-Type from the route is preserved.
  if (
    path === "/sitemap.xml" ||
    path === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // If user is on auth page but already signed in, redirect to home page
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const publicPaths = new Set(["/", "/privacy", "/terms", "/sitemap.xml", "/robots.txt"]);

  let isThemePage = false;
  if (!session) {
    const segments = path.split("/").filter(Boolean);
    if (segments.length === 1) {
      try {
        const themeCheckUrl = new URL(
          `/api/landing-page-themes/category/${segments[0]}`,
          request.url,
        );
        const themeResponse = await fetch(themeCheckUrl, { cache: "no-store" });
        if (themeResponse.ok) {
          const theme = await themeResponse.json();
          if (theme && theme.isActive !== false) {
            isThemePage = true;
          }
        }
      } catch (error) {
        console.error("Theme lookup failed in middleware", error);
      }
    }
  }

  const isPublicPath =
    publicPaths.has(path) ||
    path.startsWith("/integrations/social/tiktok") ||
    isThemePage;

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

  if (isAdminPath) {
    // First check isAdmin property (preferred method)
    if (session?.user?.isAdmin) {
      return NextResponse.next();
    }

    // Fallback to email-based check for backward compatibility
    const allowedEmails = env.ADMIN_ALLOWED_EMAILS
      ? env.ADMIN_ALLOWED_EMAILS.split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const userEmail = session?.user?.email?.toLowerCase();
    if (!userEmail || !allowedEmails.includes(userEmail)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// Add routes that should be protected by authentication
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
