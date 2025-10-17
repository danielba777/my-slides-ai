import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${env.SLIDESCOCKPIT_API}/integrations/social/tiktok/accounts`,
      {
        method: "GET",
        headers: {
          "x-user-id": session.user.id,
        },
        cache: "no-store",
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            typeof data === "object" && data && "error" in data
              ? (data as { error: string }).error
              : typeof data === "object" && data && "message" in data
              ? (data as { message: string }).message
              : "Failed to load TikTok accounts",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Failed to fetch TikTok accounts", error);
    return NextResponse.json(
      { error: "Unable to reach SlidesCockpit API" },
      { status: 500 },
    );
  }
}
