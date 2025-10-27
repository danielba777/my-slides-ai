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

    const response = await fetch(`${API_BASE_URL}/imagesets/${id}`, {
      headers,
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch image set" },
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
    const session = await auth();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.user?.id) {
      headers["x-user-id"] = session.user.id;
    }

    const response = await fetch(`${API_BASE_URL}/imagesets/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update image set" },
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
    const session = await auth();
    const headers: Record<string, string> = {};
    if (session?.user?.id) {
      headers["x-user-id"] = session.user.id;
    }

    const response = await fetch(`${API_BASE_URL}/imagesets/${id}`, {
      method: "DELETE",
      headers,
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete image set" },
      { status: 500 },
    );
  }
}
