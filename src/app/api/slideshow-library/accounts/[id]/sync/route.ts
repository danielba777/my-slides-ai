import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.SLIDESCOCKPIT_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const response = await fetch(
      `${API_BASE_URL}/slideshow-library/accounts/${id}/sync`,
      {
        method: "POST",
      },
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to sync account" },
      { status: 500 },
    );
  }
}

