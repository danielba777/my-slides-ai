import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { utapi } from "@/app/api/uploadthing/core";

const updateSchema = z
  .object({
    title: z.string().trim().max(120).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields provided",
  });

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: videoId } = await params;
  if (!videoId) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 });
  }

  const video = await db.userUGCVideo.findFirst({
    where: { id: videoId, userId: session.user.id },
    include: {
      reactionAvatar: {
        select: { id: true, name: true, thumbnailUrl: true },
      },
      demoVideo: {
        select: { id: true, name: true, thumbnailUrl: true, videoUrl: true },
      },
    },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.json({ video });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: videoId } = await params;
  if (!videoId) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await db.userUGCVideo.findFirst({
    where: { id: videoId, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  try {
    const video = await db.userUGCVideo.update({
      where: { id: videoId },
      data: {
        ...("title" in parsed.data
          ? { title: parsed.data.title && parsed.data.title.length > 0 ? parsed.data.title : null }
          : {}),
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
    return NextResponse.json({ video });
  } catch (error) {
    console.error("[UGC][Videos][PATCH] Failed to update video", error);
    return NextResponse.json(
      { error: "Failed to update video" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: videoId } = await params;

  
  const existing = await db.userUGCVideo.findFirst({
    where: { id: videoId, userId: session.user.id },
    select: { id: true, compositeVideoUrl: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  
  const fileKey = (() => {
    const url = existing.compositeVideoUrl || "";
    try {
      const u = new URL(url);
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || null;
    } catch {
      return null;
    }
  })();

  
  if (fileKey) {
    try {
      await utapi.deleteFiles(fileKey);
    } catch {
      
    }
  }

  const video = await db.userUGCVideo.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({ ok: true, video });
}
