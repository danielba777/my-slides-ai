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

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data && typeof data.error === "string"
          ? data.error
          : "TikTok posting failed";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("TikTok posting request failed", error);
    return NextResponse.json({ error: "Unable to reach SlidesCockpit API" }, { status: 500 });
  }
}
