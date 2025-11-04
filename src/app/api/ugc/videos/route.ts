export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { composeReactionDemoVideo } from "@/server/ugc/video-composer";

const createVideoSchema = z.object({
  reactionAvatarId: z.string().trim().min(1, "reactionAvatarId is required"),
  demoVideoId: z.string().trim().min(1).optional().or(z.literal("")).nullable(),
  title: z.string().trim().max(120).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const videos = await db.userUGCVideo.findMany({
      where: { userId: session.user.id },
      include: {
        reactionAvatar: {
          select: { id: true, name: true, thumbnailUrl: true },
        },
        demoVideo: {
          select: { id: true, name: true, thumbnailUrl: true, videoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("[UGC][Videos][GET] Failed to fetch videos", error);
    return NextResponse.json(
      { error: "Failed to load generated videos" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { reactionAvatarId, demoVideoId, title } = parsed.data;

  const avatar = await db.reactionAvatar.findUnique({
    where: { id: reactionAvatarId },
  });
  if (!avatar || !avatar.isActive) {
    return NextResponse.json({ error: "Reaction avatar not available" }, { status: 404 });
  }

  let demo: { id: string; videoUrl: string } | null = null;
  if (demoVideoId) {
    demo = await db.userDemoVideo.findFirst({
      where: { id: demoVideoId, userId: session.user.id },
      select: { id: true, videoUrl: true },
    });
    if (!demo) {
      return NextResponse.json({ error: "Demo video not found" }, { status: 404 });
    }
  }

  try {
    const composed = await composeReactionDemoVideo({
      reactionUrl: avatar.videoUrl,
      demoUrl: demo?.videoUrl ?? null,
      userId: session.user.id,
    });

    const video = await db.userUGCVideo.create({
      data: {
        userId: session.user.id,
        title: title && title.length > 0 ? title : null,
        reactionAvatarId: avatar.id,
        demoVideoId: demo?.id ?? null,
        compositeVideoUrl: composed.videoUrl,
        compositeThumbnailUrl: composed.thumbnailUrl ?? null,
        status: "READY",
        durationMs: composed.durationMs,
        processedAt: new Date(),
        rawSegments: {
          reactionVideoUrl: avatar.videoUrl,
          demoVideoUrl: demo?.videoUrl ?? null,
        },
      },
      include: {
        reactionAvatar: {
          select: { id: true, name: true, thumbnailUrl: true },
        },
        demoVideo: {
          select: { id: true, name: true, thumbnailUrl: true, videoUrl: true },
        },
      },
    });

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("[UGC][Videos][POST] Failed to compose video", error);
    return NextResponse.json(
      { error: "Failed to generate video" },
      { status: 500 },
    );
  }
}

