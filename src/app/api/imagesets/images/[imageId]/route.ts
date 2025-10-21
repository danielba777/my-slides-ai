import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.SLIDESCOCKPIT_API || "http://localhost:3000";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> },
) {
  try {
    const { imageId } = await params;
    const response = await fetch(
      `${API_BASE_URL}/imagesets/images/${imageId}`,
      {
        method: "DELETE",
      },
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
