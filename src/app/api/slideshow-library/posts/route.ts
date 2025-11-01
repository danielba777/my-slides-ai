import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.SLIDESCOCKPIT_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const accountId = searchParams.get("accountId");

    let url = `${API_BASE_URL}/slideshow-library/posts`;
    if (accountId) {
      url = `${API_BASE_URL}/slideshow-library/accounts/${accountId}/posts`;
    }
    if (limit) {
      url += `?limit=${limit}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    // Browser-/Edge-caching für die Marketing-Hero-Query erlauben
    return NextResponse.json(data, {
      headers: {
        // 5 Minuten frisch, 30 Minuten staled erlauben
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/slideshow-library/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
