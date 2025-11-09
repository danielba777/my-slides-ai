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

    const params = new URLSearchParams({ limit, shuffle });
    if (category) {
      params.set("category", category);
    }

    const response = await fetch(
      `${API_BASE_URL}/slideshow-library/posts?${params.toString()}`,
      {
        cache: "no-store",
      },
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

    const posts = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.posts)
        ? raw.posts ?? []
        : [];

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
