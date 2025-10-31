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

    const rawResponseText = await response.text();
    let payload: unknown = null;
    try {
      payload = JSON.parse(rawResponseText);
    } catch {
      payload = null;
    }

    console.log("[TikTokPostAPI][Status] Upstream response", {
      openId,
      publishId,
      status: response.status,
      statusText: response.statusText,
      body: rawResponseText,
    });

    if (
      payload &&
      typeof payload === "object" &&
      payload !== null
    ) {
      const record = payload as Record<string, unknown>;
      if (typeof record.failReason === "string" && !record.error) {
        record.error = record.failReason;
      } else if (typeof record.fail_reason === "string" && !record.error) {
        record.error = record.fail_reason;
      }
    }

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof (payload as { error?: string }).error === "string"
          ? (payload as { error: string }).error
          : rawResponseText || "TikTok status check failed";
      return NextResponse.json(
        { error: message, upstreamBody: rawResponseText },
        { status: response.status },
      );
    }

    return NextResponse.json(payload ?? rawResponseText, { status: 200 });
  } catch (error) {
    console.error("TikTok status polling failed", error);
    return NextResponse.json({ error: "Unable to reach SlidesCockpit API" }, { status: 500 });
  }
}
