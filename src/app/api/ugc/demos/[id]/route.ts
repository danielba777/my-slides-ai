import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/server/auth";
import { db } from "@/server/db";

const updateDemoSchema = z
  .object({
    name: z.string().trim().nullable().optional(),
    videoUrl: z.string().trim().min(1).optional(),
    thumbnailUrl: z.string().trim().nullable().optional(),
    durationMs: z.number().int().min(0).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields provided",
  });

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: demoId } = await params;
  if (!demoId) {
    return NextResponse.json({ error: "Missing demo id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateDemoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await db.userDemoVideo.findFirst({
    where: { id: demoId, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Demo not found" }, { status: 404 });
  }

  const data = parsed.data;
  try {
    const demo = await db.userDemoVideo.update({
      where: { id: demoId },
      data: {
        ...("name" in data ? { name: data.name ?? null } : {}),
        ...("thumbnailUrl" in data ? { thumbnailUrl: data.thumbnailUrl ?? null } : {}),
        ...("videoUrl" in data ? { videoUrl: data.videoUrl } : {}),
        ...("durationMs" in data ? { durationMs: data.durationMs ?? null } : {}),
      },
    });
    return NextResponse.json({ demo });
  } catch (error) {
    console.error("[UGC][Demos][PATCH] Failed to update demo video", error);
    return NextResponse.json(
      { error: "Failed to update demo video" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: demoId } = await params;
  if (!demoId) {
    return NextResponse.json({ error: "Missing demo id" }, { status: 400 });
  }

  const existing = await db.userDemoVideo.findFirst({
    where: { id: demoId, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Demo not found" }, { status: 404 });
  }

  try {
    await db.userDemoVideo.delete({
      where: { id: demoId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[UGC][Demos][DELETE] Failed to delete demo video", error);
    return NextResponse.json(
      { error: "Failed to delete demo video" },
      { status: 500 },
    );
  }
}
