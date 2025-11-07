import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

interface TikTokStatusResponse {
  status: "processing" | "success" | "failed" | "inbox";
  postId?: string;
  releaseUrl?: string;
  error?: string;
  publishId: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ openId: string; publishId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { openId, publishId } = await params;

  if (!openId || !publishId) {
    return NextResponse.json({ error: "Missing openId or publishId" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${env.SLIDESCOCKPIT_API}/integrations/social/tiktok/${encodeURIComponent(openId)}/post/status/${encodeURIComponent(publishId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
      },
    );

    if (!response.ok) {
      console.error("[TikTokStatusAPI] Backend error:", response.status, response.statusText);
      return NextResponse.json(
        { error: `TikTok API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as TikTokStatusResponse;
    console.log("[TikTokStatusAPI] Status response:", data);

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("[TikTokStatusAPI] Network error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend API" },
      { status: 500 }
    );
  }
}