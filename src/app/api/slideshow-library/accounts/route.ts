import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.SLIDESCOCKPIT_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/slideshow-library/accounts`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch slideshow accounts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/slideshow-library/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create slideshow account" },
      { status: 500 },
    );
  }
}

