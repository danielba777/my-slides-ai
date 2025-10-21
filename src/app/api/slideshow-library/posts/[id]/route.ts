import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.SLIDESCOCKPIT_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const response = await fetch(
      `${API_BASE_URL}/slideshow-library/posts/${id}`,
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const response = await fetch(
      `${API_BASE_URL}/slideshow-library/posts/${id}`,
      {
        method: "DELETE",
      },
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
