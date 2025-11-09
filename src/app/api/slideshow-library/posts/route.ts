import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.SLIDESCOCKPIT_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const accountId = searchParams.get("accountId");
    const category = searchParams.get("category");
    const shuffle = searchParams.get("shuffle");

    let url = `${API_BASE_URL}/slideshow-library/posts`;
    if (accountId) {
      url = `${API_BASE_URL}/slideshow-library/accounts/${accountId}/posts`;
    }

    const params = new URLSearchParams();
    if (limit) params.set("limit", limit);
    if (offset) params.set("offset", offset);
    if (category) params.set("category", category);
    if (shuffle) params.set("shuffle", shuffle);

    const paramString = params.toString();
    if (paramString) {
      url += `?${paramString}`;
    }

    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();
        return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
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
