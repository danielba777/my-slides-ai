import { env } from "@/env";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(`${env.SLIDESCOCKPIT_API}/integrations/social/tiktok`, {
      method: "GET",
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
      return errorResponse;
    }

    const successResponse = NextResponse.json(data, {
      status: response.status,
    });
    return successResponse;
  } catch (error) {
    console.error("Failed to start TikTok integration", error);
    return NextResponse.json(
      { error: "Unable to reach SlidesCockpit API" },
      { status: 500 },
    );
  }
}
