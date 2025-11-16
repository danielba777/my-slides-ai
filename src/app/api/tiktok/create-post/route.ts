import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

type TikTokPostMode = "MEDIA_UPLOAD" | "DIRECT_POST" | "INBOX" | "PUBLISH";
type TikTokPrivacyLevel = "PUBLIC" | "FRIENDS" | "SELF_ONLY";
type TikTokBrandOption = "YOUR_BRAND" | "BRANDED_CONTENT" | "BOTH" | null;

interface TikTokPostRequest {
  caption?: string;
  title?: string;
  coverIndex?: number;
  autoAddMusic?: boolean;
  postMode?: TikTokPostMode;
  photoImages?: string[];
  openId?: string;
  privacyLevel?: TikTokPrivacyLevel;
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
  isCommercialContent?: boolean;
  brandOption?: TikTokBrandOption;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as TikTokPostRequest;

    if (
      !body ||
      typeof body.openId !== "string" ||
      !body.openId.trim() ||
      !body.photoImages ||
      body.photoImages.length === 0 ||
      typeof body.caption !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing required fields: openId, caption, photoImages" },
        { status: 400 },
      );
    }

    const trimmedCaption = body.caption.trim();
    const trimmedTitle = body.title?.trim() ?? "";
    const coverIndex = Number.isFinite(body.coverIndex)
      ? Math.floor(body.coverIndex as number)
      : 0;
    const normalizedCoverIndex = Math.max(
      0,
      Math.min(coverIndex, body.photoImages.length - 1),
    );

    const orderedImages = [...body.photoImages];
    if (
      normalizedCoverIndex > 0 &&
      normalizedCoverIndex < orderedImages.length
    ) {
      const [coverImage] = orderedImages.splice(normalizedCoverIndex, 1);
      if (coverImage) {
        orderedImages.unshift(coverImage);
      }
    }

    const sanitizedImages = orderedImages
      .map((url) => (typeof url === "string" ? url.trim() : ""))
      .filter((url) => url.length > 0);

    if (sanitizedImages.length === 0) {
      return NextResponse.json(
        { error: "At least one valid photo URL is required" },
        { status: 400 },
      );
    }

    const allowedPostModes: TikTokPostMode[] = [
      "MEDIA_UPLOAD",
      "DIRECT_POST",
      "INBOX",
      "PUBLISH",
    ];
    const resolvedPostMode = allowedPostModes.includes(
      body.postMode as TikTokPostMode,
    )
      ? (body.postMode as TikTokPostMode)
      : "MEDIA_UPLOAD";

    const allowedPrivacyLevels: TikTokPrivacyLevel[] = [
      "PUBLIC",
      "FRIENDS",
      "SELF_ONLY",
    ];
    const resolvedPrivacyLevel = allowedPrivacyLevels.includes(
      body.privacyLevel as TikTokPrivacyLevel,
    )
      ? (body.privacyLevel as TikTokPrivacyLevel)
      : undefined;

    const settings: Record<string, unknown> = {
      contentPostingMethod: "URL",
      autoAddMusic: body.autoAddMusic ?? true,
    };

    if (trimmedTitle.length > 0) {
      settings.title = trimmedTitle;
    }
    if (resolvedPrivacyLevel) {
      settings.privacyLevel = resolvedPrivacyLevel;
    }
    if (typeof body.disableComment === "boolean") {
      settings.comment = !body.disableComment;
    }
    if (typeof body.disableDuet === "boolean") {
      settings.duet = !body.disableDuet;
    }
    if (typeof body.disableStitch === "boolean") {
      settings.stitch = !body.disableStitch;
    }
    if (body.isCommercialContent) {
      const brandOption = body.brandOption;
      const brandedContentSelected =
        brandOption === "BRANDED_CONTENT" || brandOption === "BOTH";
      const yourBrandSelected =
        brandOption === "YOUR_BRAND" || brandOption === "BOTH";
      settings.brandContentToggle = brandedContentSelected;
      settings.brandOrganicToggle = yourBrandSelected;
    }

    const payload = {
      caption: trimmedCaption,
      postMode: resolvedPostMode,
      media: sanitizedImages.map((url) => ({
        type: "photo" as const,
        url,
      })),
      settings,
    };

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
        const errorData = await response.json().catch(
          () =>
            ({}) as {
              message?: string;
              error?: string;
              statusCode?: number;
            },
        );

        console.error("[TikTokCreatePostAPI] Backend error:", errorData);

        const errorMessage =
          errorData.message ||
          errorData.error ||
          `TikTok API error: ${response.status} ${response.statusText}`;

        return NextResponse.json(
          {
            error: errorMessage,
            originalError: errorData.error || `HTTP ${response.status}`,
            statusCode: errorData.statusCode || response.status,
          },
          { status: response.status },
        );
      }

      const data = await response.json().catch(() => null);
      console.log("[TikTokCreatePostAPI] Backend response:", data);

      if (!data) {
        return NextResponse.json(
          { error: "Invalid response from backend" },
          { status: 500 },
        );
      }

      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      console.error("[TikTokCreatePostAPI] Network error:", error);
      return NextResponse.json(
        { error: "Failed to connect to backend API" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[TikTokCreatePostAPI] Request parsing error:", error);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 },
    );
  }
}
