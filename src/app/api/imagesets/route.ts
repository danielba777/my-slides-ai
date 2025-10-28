import { auth } from "@/server/auth";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.SLIDESCOCKPIT_API || "http://localhost:3000";

export async function GET() {
  try {
    const session = await auth();
    const headers: Record<string, string> = {};
    if (session?.user?.id) {
      headers["x-user-id"] = session.user.id;
    }

    const response = await fetch(`${API_BASE_URL}/imagesets`, {
      headers,
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch image sets" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/imagesets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create image set" },
      { status: 500 },
    );
  }
}
