import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

import { auth } from "@/server/auth"; // your existing auth helper
import { db } from "@/server/db";
import { createAvatar4Hook } from "@/server/vendors/three02";
/**
 * POST /api/admin/ugc/reaction-avatars/generate
 * Body: { avatarIds: string[], prompt: string, count?: number }
 * For each avatar id, generate exactly `count` (default 1) 5s hook video using 302.ai Avatar-4.
 * Stores the last generated URL into reactionAvatar.videoUrl (Hook clip).
 */
const HOOKS_FOLDER = path.join(process.cwd(), "public", "ugc", "reaction-hooks");
const HOOKS_PREFIX = "/ugc/reaction-hooks";

const ensureHooksFolder = async () => {
  await fs.mkdir(HOOKS_FOLDER, { recursive: true });
};

const toFileName = (avatarId: string) => `${avatarId}-${randomUUID()}.mp4`;

const downloadHookVideo = async (videoUrl: string, filePath: string) => {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
};

const removePreviousHookVideo = async (videoUrl?: string | null) => {
  if (!videoUrl || !videoUrl.startsWith(HOOKS_PREFIX)) {
    return;
  }
  const relative = videoUrl.slice(HOOKS_PREFIX.length).replace(/^[/\\]/, "");
  const filePath = path.join(HOOKS_FOLDER, relative);
  await fs.unlink(filePath).catch(() => {});
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const userEmail = session?.user?.email?.toLowerCase() ?? "";
    const isAllowed = !!userEmail && allowedEmails.includes(userEmail);

    if (!session?.user?.id || (!session.user.isAdmin && !isAllowed)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { avatarIds, prompt, count } = (await req.json()) as {
      avatarIds: string[];
      prompt: string;
      count?: number;
    };
    if (!Array.isArray(avatarIds) || avatarIds.length === 0) {
      return NextResponse.json({ error: "No avatars provided" }, { status: 400 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }
    const runs = Math.min(Math.max(Number(count ?? 1), 1), 21);

    const avatars = await db.reactionAvatar.findMany({
      where: { id: { in: avatarIds } },
      select: { id: true, thumbnailUrl: true, videoUrl: true },
    });
    if (avatars.length === 0) {
      return NextResponse.json({ error: "Avatars not found" }, { status: 404 });
    }

    const results: Array<{ id: string; videoUrl: string }> = [];
    await ensureHooksFolder();

    for (const av of avatars) {
      let lastUrl = "";
      // Generate `runs` times; we keep the last URL as current hook video
      for (let i = 0; i < runs; i++) {
        lastUrl = await createAvatar4Hook(av.thumbnailUrl, prompt, {
          durationSeconds: 5,
        });
      }

      const fileName = toFileName(av.id);
      const filePath = path.join(HOOKS_FOLDER, fileName);
      await downloadHookVideo(lastUrl, filePath);
      const publicUrl = `${HOOKS_PREFIX}/${fileName}`;

      await removePreviousHookVideo(av.videoUrl);

      await db.reactionAvatar.update({
        where: { id: av.id },
        data: { videoUrl: publicUrl },
      });
      results.push({ id: av.id, videoUrl: publicUrl });
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("[admin.reaction-avatars.generate] error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
