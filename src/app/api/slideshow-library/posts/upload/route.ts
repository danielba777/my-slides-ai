import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.SLIDESCOCKPIT_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const response = await fetch(
      `${API_BASE_URL}/slideshow-library/posts/upload-slides`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to upload slideshow slides" },
      { status: 500 },
    );
  }
}
