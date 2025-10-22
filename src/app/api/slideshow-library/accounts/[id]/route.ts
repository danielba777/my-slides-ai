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
      `${API_BASE_URL}/slideshow-library/accounts/${id}`,
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const response = await fetch(
      `${API_BASE_URL}/slideshow-library/accounts/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update account" },
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
      `${API_BASE_URL}/slideshow-library/accounts/${id}`,
      {
        method: "DELETE",
      },
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}

