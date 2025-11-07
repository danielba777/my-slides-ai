import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

interface CreatorInfoResponse {
  privacy_level_options: string[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
  post_limits?: {
    can_post: boolean;
    reason?: string;
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ openId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { openId } = await params;

  if (!openId) {
    return NextResponse.json({ error: "Missing openId" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${env.SLIDESCOCKPIT_API}/integrations/social/tiktok/${encodeURIComponent(openId)}/creator-info`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
      },
    );

    if (!response.ok) {
      console.error("[TikTokCreatorInfoAPI] Backend error:", response.status, response.statusText);
      return NextResponse.json(
        { error: `TikTok API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as CreatorInfoResponse;
    console.log("[TikTokCreatorInfoAPI] Creator info response:", data);

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("[TikTokCreatorInfoAPI] Network error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend API" },
      { status: 500 }
    );
  }
}