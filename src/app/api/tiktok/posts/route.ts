import { NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import { auth } from "@/server/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const openId = request.nextUrl.searchParams.get("openId");
  const baseUrl = `${env.SLIDESCOCKPIT_API}/integrations/social/tiktok`;
  const endpoint = openId
    ? `${baseUrl}/${encodeURIComponent(openId)}/posts`
    : `${baseUrl}/posts`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-user-id": session.user.id,
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && payload && "error" in payload && typeof (payload as any).error === "string"
          ? (payload as any).error
          : "Failed to load TikTok posts";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Failed to fetch TikTok posts", error);
    return NextResponse.json({ error: "Unable to reach SlidesCockpit API" }, { status: 500 });
  }
}
