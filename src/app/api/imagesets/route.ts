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
    const session = await auth();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.user?.id) {
      // WICHTIG: Owner-Verknüpfung für persönliche Kollektionen
      headers["x-user-id"] = session.user.id;
    }

    // Fallback: Wenn kein category-Feld gesetzt ist, aber ein User existiert,
    // defaulten wir auf "personal", damit die Collection sauber einsortiert wird.
    const payload =
      body && typeof body === "object"
        ? { category: "personal", ...body }
        : { category: "personal" };

    const response = await fetch(`${API_BASE_URL}/imagesets`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
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
