import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.SLIDESCOCKPIT_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ?? "300";
    const category = searchParams.get("category");
    const shuffle = searchParams.get("shuffle") ?? "true";

    let posts: Array<unknown> = [];

    // If category filter is specified, try to get category-specific posts first
    if (category) {
      const categoryParams = new URLSearchParams({ limit, shuffle, category });
      const categoryResponse = await fetch(
        `${API_BASE_URL}/slideshow-library/posts?${categoryParams.toString()}`,
        { cache: "no-store" },
      );

      if (categoryResponse.ok) {
        const categoryRaw = (await categoryResponse.json()) as
          | Array<unknown>
          | { posts?: Array<unknown> }
          | null;

        posts = Array.isArray(categoryRaw)
          ? categoryRaw
          : Array.isArray(categoryRaw?.posts)
            ? categoryRaw.posts ?? []
            : [];
      }

      // If we don't have enough posts from the category, fetch additional posts without category filter
      const requestedLimit = parseInt(limit, 10);
      if (posts.length < requestedLimit) {
        const remainingNeeded = requestedLimit - posts.length;
        const fallbackParams = new URLSearchParams({
          limit: remainingNeeded.toString(),
          shuffle,
        });

        const fallbackResponse = await fetch(
          `${API_BASE_URL}/slideshow-library/posts?${fallbackParams.toString()}`,
          { cache: "no-store" },
        );

        if (fallbackResponse.ok) {
          const fallbackRaw = (await fallbackResponse.json()) as
            | Array<unknown>
            | { posts?: Array<unknown> }
            | null;

          const fallbackPosts = Array.isArray(fallbackRaw)
            ? fallbackRaw
            : Array.isArray(fallbackRaw?.posts)
              ? fallbackRaw.posts ?? []
              : [];

          // Combine category posts with fallback posts
          posts = [...posts, ...fallbackPosts];
        }
      }
    } else {
      // No category filter - fetch normally
      const params = new URLSearchParams({ limit, shuffle });
      const response = await fetch(
        `${API_BASE_URL}/slideshow-library/posts?${params.toString()}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        const errorPayload = await response.text().catch(() => null);
        return NextResponse.json(
          {
            error: "Failed to fetch hero slideshow posts",
            details: errorPayload,
          },
          { status: response.status },
        );
      }

      const raw = (await response.json()) as
        | Array<unknown>
        | { posts?: Array<unknown> }
        | null;

      posts = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.posts)
          ? raw.posts ?? []
          : [];
    }

    return NextResponse.json(posts, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch hero slideshow posts",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
