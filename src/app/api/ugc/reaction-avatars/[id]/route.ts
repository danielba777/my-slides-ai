import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/server/auth";
import { db } from "@/server/db";

const updateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    thumbnailUrl: z.string().trim().min(1).optional(),
    videoUrl: z.string().trim().min(1).optional(),
    order: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((values) => Object.keys(values).length > 0, {
    message: "No fields provided",
  });

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing avatar id" }, { status: 400 });
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

  const data = parsed.data;
  try {
    const avatar = await db.reactionAvatar.update({
      where: { id },
      data: {
        ...("name" in data ? { name: data.name } : {}),
        ...("description" in data ? { description: data.description ?? null } : {}),
        ...("thumbnailUrl" in data ? { thumbnailUrl: data.thumbnailUrl } : {}),
        ...("videoUrl" in data ? { videoUrl: data.videoUrl } : {}),
        ...("order" in data ? { order: data.order ?? 0 } : {}),
        ...("isActive" in data ? { isActive: data.isActive ?? false } : {}),
      },
    });
    return NextResponse.json({ avatar });
  } catch (error) {
    console.error("[UGC][ReactionAvatars][PATCH] Failed to update avatar", error);
    return NextResponse.json(
      { error: "Failed to update reaction avatar" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing avatar id" }, { status: 400 });
  }

  try {
    await db.reactionAvatar.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[UGC][ReactionAvatars][DELETE] Failed to delete avatar", error);
    return NextResponse.json(
      { error: "Failed to delete reaction avatar" },
      { status: 500 },
    );
  }
}
