import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

interface RequestPayload {
  openId?: string;
  caption?: string;
  title?: string;
  coverIndex?: number;
  photoImages?: string[];
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RequestPayload | null;
  if (
    !body ||
    typeof body.openId !== "string" ||
    !Array.isArray(body.photoImages) ||
    body.photoImages.length === 0
  ) {
    return NextResponse.json(
      { error: "Missing openId or photoImages" },
      { status: 400 },
    );
  }

  console.log("[TikTokPostAPI] Incoming request", {
    openId: body.openId,
    photoImages: body.photoImages,
  });

  const payload = {
    caption: body.caption ?? "",
    postMode: (body.postMode as "DIRECT_POST" | "MEDIA_UPLOAD") ?? "MEDIA_UPLOAD",
    media: body.photoImages.map((url) => ({
      type: "photo" as const,
      url,
    })),
    settings: {
      contentPostingMethod: "URL" as const,
      autoAddMusic: body.autoAddMusic ?? true,
      title:
        body.title && body.title.trim().length > 0
          ? body.title.trim()
          : undefined,
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
