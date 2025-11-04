export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/env";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

const scheduleSchema = z.object({
  openId: z.string().trim().min(1, "openId is required"),
  publishAt: z.string().trim().min(1, "publishAt is required"),
  idempotencyKey: z.string().trim().min(1, "idempotencyKey is required"),
  caption: z.string().optional(),
  title: z.string().optional(),
  autoAddMusic: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: videoId } = await params;
  if (!videoId) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 });
  }

  const ugcVideo = await db.userUGCVideo.findFirst({
    where: { id: videoId, userId: session.user.id },
    select: { compositeVideoUrl: true },
  });
  if (!ugcVideo) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { openId, publishAt, idempotencyKey, caption, title, autoAddMusic } = parsed.data;

  const publishDate = new Date(publishAt);
  if (Number.isNaN(publishDate.getTime())) {
    return NextResponse.json({ error: "Invalid publishAt value" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${env.SLIDESCOCKPIT_API}/integrations/social/tiktok/${encodeURIComponent(openId)}/schedule`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({
          publishAt: publishDate.toISOString(),
          idempotencyKey,
          post: {
            caption: caption ?? "",
            postMode: "MEDIA_UPLOAD",
            media: [
              {
                type: "video",
                url: ugcVideo.compositeVideoUrl,
              },
            ],
            settings: {
              contentPostingMethod: "URL",
              autoAddMusic: autoAddMusic ?? true,
              title: title && title.trim().length > 0 ? title.trim() : undefined,
            },
          },
        }),
      },
    );

    const rawResponseText = await response.text();
    let payload: unknown = null;
    try {
      payload = JSON.parse(rawResponseText);
    } catch {
      payload = rawResponseText;
    }

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof (payload as { error?: string }).error === "string"
          ? (payload as { error: string }).error
          : "TikTok scheduling failed";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    if (payload && typeof payload === "object" && payload !== null) {
      const updateData: Record<string, unknown> = {};
      if ("jobKey" in payload && typeof payload.jobKey === "string") {
        updateData.scheduleJobId = payload.jobKey;
      }
      if ("runAt" in payload && typeof payload.runAt === "string") {
        updateData.scheduleRunAt = new Date(payload.runAt);
      }

      if (Object.keys(updateData).length > 0) {
        await db.userUGCVideo.update({
          where: { id: videoId },
          data: updateData,
        });
      }
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("[UGC][Videos][Schedule] Upstream request failed", error);
    return NextResponse.json(
      { error: "Unable to schedule TikTok post" },
      { status: 500 },
    );
  }
}
