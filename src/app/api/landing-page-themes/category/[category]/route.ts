import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.SLIDESCOCKPIT_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const response = await fetch(
      `${API_BASE_URL}/landing-page-themes/category/${category}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(null);
      }
      throw new Error("Failed to fetch theme");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching theme by category:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme" },
      { status: 500 }
    );
  }
}

