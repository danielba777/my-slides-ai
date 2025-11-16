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

    // If category filter is specified, fetch category posts and repeat them if needed
    if (category) {
      // Fetch all available posts from this category (use high limit)
      const categoryParams = new URLSearchParams({
        limit: "10000", // Fetch all available posts from category
        shuffle,
        category
      });
      const categoryResponse = await fetch(
        `${API_BASE_URL}/slideshow-library/posts?${categoryParams.toString()}`,
        { cache: "no-store" },
      );

      if (categoryResponse.ok) {
        const categoryRaw = (await categoryResponse.json()) as
          | Array<unknown>
          | { posts?: Array<unknown> }
          | null;

        const categoryPosts = Array.isArray(categoryRaw)
          ? categoryRaw
          : Array.isArray(categoryRaw?.posts)
            ? categoryRaw.posts ?? []
            : [];

        // If we have posts, repeat them to reach the requested limit
        if (categoryPosts.length > 0) {
          const requestedLimit = parseInt(limit, 10);
          posts = [];

          // Repeat posts until we reach the requested limit
          while (posts.length < requestedLimit) {
            const remaining = requestedLimit - posts.length;
            const postsToAdd = categoryPosts.slice(0, Math.min(remaining, categoryPosts.length));
            posts = [...posts, ...postsToAdd];
          }
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
