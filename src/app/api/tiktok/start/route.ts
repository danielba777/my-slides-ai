import { env } from "@/env";
import { applyPostizCookies, ensurePostizCookie } from "@/lib/postiz-session";
import { NextResponse } from "next/server";

export async function GET() {
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

  try {
    const response = await fetch(`${env.POSTIZ_API}/integrations/social/tiktok`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorResponse = NextResponse.json(
        {
          error:
            typeof data === "object" && data && "message" in data
              ? (data as { message: string }).message
              : "Failed to start TikTok integration",
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
    console.error("Failed to start TikTok integration", error);
    return NextResponse.json(
      { error: "Unable to reach Postiz API" },
      { status: 500 },
    );
  }
}
