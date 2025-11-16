
import { auth } from "@/server/auth";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.SLIDESCOCKPIT_API || "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    const headers: Record<string, string> = {};
    if (session?.user?.id) {
      headers["x-user-id"] = session.user.id;
    }

    const response = await fetch(
      `${API_BASE_URL}/imagesets/${id}/random-image`,
      { headers, cache: "no-store" },
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get random image" },
      { status: 500 },
    );
  }
}
