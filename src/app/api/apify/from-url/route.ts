import { NextResponse } from "next/server";

import { ApifyIngestError, ingestTikTokPost } from "../run/route";
import { db } from "@/server/db";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function extractFromTikTokUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new ApifyIngestError("Invalid URL provided", 400);
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    throw new ApifyIngestError("Could not parse TikTok URL", 400);
  }

  const usernameSegment = segments.find((segment) => segment.startsWith("@"));
  const profileUsername = usernameSegment
    ?.replace(/^@/, "")
    ?.trim()
    ?.toLowerCase();

  const possibleId = segments.at(-1) ?? "";
  const numericMatch = possibleId.match(/\d+/);
  const awemeId = numericMatch ? numericMatch[0] : null;

  console.log("[apify/from-url] URL extraction debug:", {
    url: rawUrl,
    segments,
    possibleId,
    numericMatch,
    awemeId,
    profileUsername,
    hasPhotoSegment: segments.includes("photo"),
    hasVideoSegment: segments.includes("video"),
  });

  if (segments.includes("photo")) {
    console.log("[apify/from-url] Detected photo post", {
      awemeId,
      profileUsername,
      urlType: "photo",
    });
  } else if (segments.includes("video")) {
    console.log("[apify/from-url] Detected video post", {
      awemeId,
      profileUsername,
      urlType: "video",
    });
  }

  if (!awemeId || !profileUsername) {
    throw new ApifyIngestError(
      "Could not extract aweme id or username from TikTok URL",
      400,
    );
  }

  return { awemeId, profileUsername };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function POST(request: Request) {
  try {
    const user = await authenticateExtensionUser(request);

    const { url } = (await request.json()) as { url?: string };
    if (!url || !url.trim()) {
      throw new ApifyIngestError("Missing url in request body", 400);
    }

    console.debug("[apify/from-url] Incoming request", {
      url,
      time: new Date().toISOString(),
    });

    const { awemeId, profileUsername } = extractFromTikTokUrl(url);
    console.debug("[apify/from-url] Parsed identifiers", {
      awemeId,
      profileUsername,
    });

    const result = await ingestTikTokPost({
      awemeId,
      profileUsername,
      ownerUserId: user.id,
    });

    console.debug("[apify/from-url] Ingest completed", {
      awemeId,
      profileUsername,
      accountId: result.account?.id,
      postId: result.post?.id,
    });

    return NextResponse.json(result, {
  headers: corsHeaders
});
  } catch (error) {
    if (error instanceof ApifyIngestError) {
      console.warn("[apify/from-url] Known ingestion error", {
        message: error.message,
        status: error.status,
        payload: error.payload,
      });
      return NextResponse.json(
        { error: error.message, data: error.payload },
        {
          status: error.status,
          headers: corsHeaders
        },
      );
    }

    console.error("[apify/from-url] Unexpected failure", error);
    return NextResponse.json(
      { error: "Failed to ingest TikTok URL" },
      {
        status: 500,
        headers: corsHeaders
      },
    );
  }
}

async function authenticateExtensionUser(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();

  if (!token) {
    throw new ApifyIngestError("Missing extension token", 401);
  }

  try {
    const adminResponse = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/library-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (adminResponse.ok) {
      const adminResult = await adminResponse.json();
      if (adminResult.isValid) {
        console.log("[apify/from-url] Admin library token detected");
        return {
          id: "admin-library",
          email: "admin@slidescockpit.com",
          isAdmin: true
        };
      }
    }
  } catch (error) {
    console.debug("[apify/from-url] Admin token check failed, trying normal user:", error);
  }

  const user = await db.user.findUnique({
    where: { extensionToken: token },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new ApifyIngestError("Invalid extension token", 401);
  }

  return { ...user, isAdmin: false };
}
