import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/server/auth";
import { db } from "@/server/db";

const createDemoSchema = z.object({
  name: z.string().trim().min(1).optional(),
  videoUrl: z.string().trim().min(1, "Video URL is required"),
  thumbnailUrl: z.string().trim().min(1).optional(),
  durationMs: z.number().int().min(0).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const demos = await db.userDemoVideo.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ demos });
  } catch (error) {
    console.error("[UGC][Demos][GET] Failed to fetch demo videos", error);
    return NextResponse.json(
      { error: "Failed to load demo videos" },
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

  const parsed = createDemoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  try {
    const demo = await db.userDemoVideo.create({
      data: {
        userId: session.user.id,
        name: data.name ?? null,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl ?? null,
        durationMs: data.durationMs ?? null,
      },
    });
    return NextResponse.json({ demo }, { status: 201 });
  } catch (error) {
    console.error("[UGC][Demos][POST] Failed to create demo video", error);
    return NextResponse.json(
      { error: "Failed to create demo video" },
      { status: 500 },
    );
  }
}

