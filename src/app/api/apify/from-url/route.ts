import { NextResponse } from "next/server";

import { ApifyIngestError, ingestTikTokPost } from "../run/route";

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

  if (!awemeId || !profileUsername) {
    throw new ApifyIngestError(
      "Could not extract aweme id or username from TikTok URL",
      400,
    );
  }

  return { awemeId, profileUsername };
}

export async function POST(request: Request) {
  try {
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

    const result = await ingestTikTokPost({ awemeId, profileUsername });

    console.debug("[apify/from-url] Ingest completed", {
      awemeId,
      profileUsername,
      accountId: result.account?.id,
      postId: result.post?.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApifyIngestError) {
      console.warn("[apify/from-url] Known ingestion error", {
        message: error.message,
        status: error.status,
        payload: error.payload,
      });
      return NextResponse.json(
        { error: error.message, data: error.payload },
        { status: error.status },
      );
    }

    console.error("[apify/from-url] Unexpected failure", error);
    return NextResponse.json(
      { error: "Failed to ingest TikTok URL" },
      { status: 500 },
    );
  }
}
