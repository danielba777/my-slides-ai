import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/server/auth";
import { db } from "@/server/db";

const baseAvatarSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  thumbnailUrl: z.string().trim().min(1, "Thumbnail URL is required"),
  videoUrl: z.string().trim().min(1, "Video URL is required"),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  const includeInactive = session?.user?.isAdmin ?? false;

  try {
    const avatars = await db.reactionAvatar.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });
    return NextResponse.json({ avatars });
  } catch (error) {
    console.error("[UGC][ReactionAvatars][GET] Failed to fetch avatars", error);
    return NextResponse.json(
      { error: "Failed to load reaction avatars" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = baseAvatarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  try {
    const avatar = await db.reactionAvatar.create({
      data: {
        name: data.name,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        videoUrl: data.videoUrl,
        order: data.order ?? 0,
        isActive: data.isActive ?? true,
        createdById: session.user.id,
      },
    });
    return NextResponse.json({ avatar }, { status: 201 });
  } catch (error) {
    console.error("[UGC][ReactionAvatars][POST] Failed to create avatar", error);
    return NextResponse.json(
      { error: "Failed to create reaction avatar" },
      { status: 500 },
    );
  }
}

