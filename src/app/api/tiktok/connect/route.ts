import { env } from "@/env";
import { applyPostizCookies, ensurePostizCookie } from "@/lib/postiz-session";
import { NextRequest, NextResponse } from "next/server";

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

  let cookieHeader: string;
  try {
    cookieHeader = await ensurePostizCookie();
  } catch (error) {
    if (error instanceof Error && error.message === "missing-postiz-session") {
      return NextResponse.json(
        { error: "Postiz session missing, login required" },
        { status: 401 },
      );
    }
    throw error;
  }

  const timezone =
    typeof payload.timezone === "string" && payload.timezone.length > 0
      ? payload.timezone
      : String(-new Date().getTimezoneOffset());

  try {
    const response = await fetch(
      `${env.POSTIZ_API}/integrations/social/tiktok/connect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
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
      applyPostizCookies(errorResponse, response);
      return errorResponse;
    }

    const successResponse = NextResponse.json(data, {
      status: response.status,
    });
    applyPostizCookies(successResponse, response);
    return successResponse;
  } catch (error) {
    console.error("Failed to complete TikTok OAuth flow", error);
    return NextResponse.json(
      { error: "Unable to reach Postiz API" },
      { status: 500 },
    );
  }
}
