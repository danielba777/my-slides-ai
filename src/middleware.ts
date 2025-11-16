import { auth } from "@/server/auth";
import { env } from "@/env";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_FILE = /\.[^/]+$/;

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  
  
  if (PUBLIC_FILE.test(path)) {
    return NextResponse.next();
  }

  const session = await auth();
  const isAuthPage = path.startsWith("/auth");
  const isAdminPath = path.startsWith("/admin");

  
  
  
  if (
    path === "/sitemap.xml" ||
    path === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const publicPaths = new Set(["/", "/privacy", "/terms", "/sitemap.xml", "/robots.txt"]);

  let isThemePage = false;
  if (!session) {
    const segments = path.split("/").filter(Boolean);
    const reservedPrefixes = [
      "/dashboard",
      "/admin",
      "/api",
      "/auth",
      "/integrations",
      "/support",
      "/landing-page-themes",
      "/posts",
      "/presentation",
    ];
    const isSingleSegment = segments.length === 1;
    const isReservedPath = reservedPrefixes.some((prefix) =>
      path.startsWith(prefix),
    );

    if (isSingleSegment && !isReservedPath) {
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
    
    if (session?.user?.isAdmin) {
      return NextResponse.next();
    }

    
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


export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
