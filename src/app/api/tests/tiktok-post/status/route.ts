import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const openId = url.searchParams.get("openId");
  const publishId = url.searchParams.get("publishId");

  if (!openId || !publishId) {
    return NextResponse.json({ error: "Missing openId or publishId" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${env.SLIDESCOCKPIT_API}/integrations/social/tiktok/${encodeURIComponent(
        openId,
      )}/post/status/${encodeURIComponent(publishId)}`,
      {
        method: "GET",
        headers: {
          "x-user-id": session.user.id,
        },
        cache: "no-store",
      },
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload && typeof payload.error === "string"
          ? payload.error
          : "TikTok status check failed";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("TikTok status polling failed", error);
    return NextResponse.json({ error: "Unable to reach SlidesCockpit API" }, { status: 500 });
  }
}

