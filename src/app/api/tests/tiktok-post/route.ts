import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

interface RequestPayload {
  openId?: string;
  caption?: string;
  mediaUrl?: string;
  mediaType?: "video" | "photo";
  thumbnailTimestampMs?: number;
  autoAddMusic?: boolean;
  postMode?: "INBOX" | "PUBLISH" | "DIRECT_POST" | "MEDIA_UPLOAD";
  contentPostingMethod?: "UPLOAD" | "MEDIA_UPLOAD" | "DIRECT_POST" | "URL";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RequestPayload | null;
  if (!body || typeof body.openId !== "string" || typeof body.mediaUrl !== "string") {
    return NextResponse.json({ error: "Missing openId or mediaUrl" }, { status: 400 });
  }

  console.log("[TikTokPostAPI] Incoming request", {
    openId: body.openId,
    mediaUrl: body.mediaUrl,
    mediaType: body.mediaType,
    postMode: body.postMode,
    contentPostingMethod: body.contentPostingMethod,
  });

  const inferredContentMethod =
    body.contentPostingMethod ??
    (body.mediaType === "photo"
      ? body.postMode === "INBOX" || body.postMode === "MEDIA_UPLOAD"
        ? "MEDIA_UPLOAD"
        : "DIRECT_POST"
      : "UPLOAD");

  const payload = {
    caption: body.caption ?? "",
    postMode: body.postMode ?? (inferredContentMethod === "MEDIA_UPLOAD" ? "INBOX" : "PUBLISH"),
    media: [
      body.mediaType === "photo"
        ? {
            type: "photo" as const,
            url: body.mediaUrl,
          }
        : {
            type: "video" as const,
            url: body.mediaUrl,
            thumbnailTimestampMs: body.thumbnailTimestampMs ?? 1000,
          },
    ],
    settings: {
      contentPostingMethod: inferredContentMethod,
      privacyLevel: "SELF_ONLY" as const,
      duet: false,
      comment: false,
      stitch: false,
      autoAddMusic: body.autoAddMusic ?? true,
      videoMadeWithAi: false,
      brandContentToggle: false,
      brandOrganicToggle: false,
    },
  };

  console.log("[TikTokPostAPI] Outgoing payload", payload);

  try {
    const response = await fetch(
      `${env.SLIDESCOCKPIT_API}/integrations/social/tiktok/${encodeURIComponent(
        body.openId,
      )}/post?async=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify(payload),
      },
    );

    const rawResponseText = await response.text();
    let data: unknown = null;
    try {
      data = JSON.parse(rawResponseText);
    } catch {
      data = null;
    }

    console.log("[TikTokPostAPI] Upstream response", {
      status: response.status,
      statusText: response.statusText,
      body: rawResponseText,
    });

    if (!response.ok) {
      const message =
        data &&
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error?: string }).error === "string"
          ? (data as { error: string }).error
          : rawResponseText || "TikTok posting failed";
      return NextResponse.json(
        { error: message, upstreamBody: rawResponseText },
        { status: response.status },
      );
    }

    return NextResponse.json(data ?? rawResponseText, { status: response.status });
  } catch (error) {
    console.error("TikTok posting request failed", error);
    return NextResponse.json({ error: "Unable to reach SlidesCockpit API" }, { status: 500 });
  }
}
