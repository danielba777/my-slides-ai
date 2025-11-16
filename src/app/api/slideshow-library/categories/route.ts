import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.SLIDESCOCKPIT_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

export async function GET() {
  try {
    // Fetch all posts without pagination to get all categories
    const response = await fetch(`${API_BASE_URL}/slideshow-library/posts?limit=10000`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    const data = await response.json();

    // Handle both array and object response formats
    const posts = Array.isArray(data) ? data : (data.posts || []);

    const categoriesSet = new Set<string>();

    for (const post of posts) {
      if (Array.isArray(post.categories)) {
        post.categories.forEach((category: string) => categoriesSet.add(category));
      }
    }

    const categories = Array.from(categoriesSet).sort();

    return NextResponse.json(categories, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

