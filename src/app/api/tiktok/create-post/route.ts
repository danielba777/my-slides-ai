import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

interface TikTokPostRequest {
  caption: string;
  title: string;
  coverIndex: number;
  autoAddMusic?: boolean;
  postMode?: "MEDIA_UPLOAD" | "DIRECT_POST";
  photoImages: string[];
  openId: string;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as TikTokPostRequest;

    // Validate required fields
    if (!body.openId || !body.caption || !body.photoImages?.length) {
      return NextResponse.json(
        { error: "Missing required fields: openId, caption, photoImages" },
        { status: 400 }
      );
    }

    // Validate that we have at least one image
    if (body.photoImages.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    // Prepare payload for backend API
    const payload = {
      caption: body.caption ?? "",
      postMode: body.postMode ?? "MEDIA_UPLOAD",
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

    // Only include coverIndex if it's provided and not zero (to avoid backend validation error)
    if (body.coverIndex > 0) {
      (payload as any).coverIndex = body.coverIndex;
    }

    console.log("[TikTokCreatePostAPI] Outgoing payload", payload);

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as {
          message?: string;
          error?: string;
          statusCode?: number;
        }));

        console.error("[TikTokCreatePostAPI] Backend error:", errorData);

        // Extract the most descriptive error message
        const errorMessage = errorData.message || errorData.error || `TikTok API error: ${response.status} ${response.statusText}`;

        return NextResponse.json(
          {
            error: errorMessage,
            originalError: errorData.error || `HTTP ${response.status}`,
            statusCode: errorData.statusCode || response.status
          },
          { status: response.status }
        );
      }

      const data = await response.json().catch(() => null);
      console.log("[TikTokCreatePostAPI] Backend response:", data);

      if (!data) {
        return NextResponse.json(
          { error: "Invalid response from backend" },
          { status: 500 }
        );
      }

      return NextResponse.json(data, { status: 200 });

    } catch (error) {
      console.error("[TikTokCreatePostAPI] Network error:", error);
      return NextResponse.json(
        { error: "Failed to connect to backend API" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("[TikTokCreatePostAPI] Request parsing error:", error);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }
}