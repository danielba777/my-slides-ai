import { env } from "@/env";
import { auth } from "@/server/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);

  if (
    !payload ||
    typeof payload.code !== "string" ||
    typeof payload.state !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing TikTok OAuth parameters" },
      { status: 400 },
    );
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timezone =
    typeof payload.timezone === "string" && payload.timezone.length > 0
      ? payload.timezone
      : String(-new Date().getTimezoneOffset());

  try {
    const response = await fetch(
      `${env.SLIDESCOCKPIT_API}/integrations/social/tiktok/connect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({
          code: payload.code,
          state: payload.state,
          timezone,
        }),
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorResponse = NextResponse.json(
        {
          error:
            typeof data === "object" && data && "message" in data
              ? (data as { message: string }).message
              : "Failed to connect TikTok account",
        },
        { status: response.status },
      );
      return errorResponse;
    }

    const successResponse = NextResponse.json(data, {
      status: response.status,
    });
    return successResponse;
  } catch (error) {
    console.error("Failed to complete TikTok OAuth flow", error);
    return NextResponse.json(
      { error: "Unable to reach SlidesCockpit API" },
      { status: 500 },
    );
  }
}
