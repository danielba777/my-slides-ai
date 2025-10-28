import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${env.SLIDESCOCKPIT_API}/ai-avatars/generations`, {
      method: "GET",
      headers: {
        "x-user-id": session.user.id,
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to load generated avatars",
          detail: data,
        },
        { status: response.status },
      );
    }

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Unexpected response when loading generated avatars" },
        { status: 502 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[AI Avatar] Failed to load creations", error);
    return NextResponse.json(
      { error: "Failed to load generated avatars" },
      { status: 500 },
    );
  }
}
