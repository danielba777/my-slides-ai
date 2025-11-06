import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import path from "path";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { createPikaImageToVideo } from "@/server/vendors/fal";

const HOOKS_FOLDER = path.join(
  process.cwd(),
  "public",
  "ugc",
  "reaction-hooks",
);
const HOOKS_PREFIX = "/ugc/reaction-hooks";

const ensureHooksFolder = async () => {
  await fs.mkdir(HOOKS_FOLDER, { recursive: true });
};

const toFileName = (avatarId: string) => `${avatarId}-${randomUUID()}.mp4`;

const downloadHookVideo = async (videoUrl: string, filePath: string) => {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(
      `Download failed: ${response.status} ${response.statusText}`,
    );
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

    const body = (await req.json()) as {
      avatarIds?: string[];
      prompt?: string;
      count?: number;
      durationSeconds?: number;
      mode?: "std" | "pro";
    };

    if (!Array.isArray(body.avatarIds) || body.avatarIds.length === 0) {
      return NextResponse.json(
        { error: "No avatars provided" },
        { status: 400 },
      );
    }

    const prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const normalizedRuns = Math.min(Math.max(Number(body.count ?? 1), 1), 5);
    const effectiveDuration = Number.isFinite(body.durationSeconds)
      ? Math.max(5, Math.min(10, Number(body.durationSeconds) >= 10 ? 10 : 5))
      : 5;
    const targetMode: "std" | "pro" = body.mode === "pro" ? "pro" : "std";

    const avatars = await db.reactionAvatar.findMany({
      where: { id: { in: body.avatarIds } },
      select: { id: true, thumbnailUrl: true, videoUrl: true },
    });

    if (avatars.length === 0) {
      return NextResponse.json({ error: "Avatars not found" }, { status: 404 });
    }

    await ensureHooksFolder();

    const results: Array<{ id: string; videoUrl: string }> = [];

    for (const avatar of avatars) {
      if (!avatar.thumbnailUrl) {
        continue;
      }

      let latestUrl = "";

      for (let run = 0; run < normalizedRuns; run += 1) {
        latestUrl = await createPikaImageToVideo(avatar.thumbnailUrl, prompt, {
          durationSeconds: effectiveDuration,
          aspectRatio: "9:16",
          mode: targetMode,
        });
      }

      if (!latestUrl) {
        throw new Error("Kling returned no video URL");
      }

      await removePreviousHookVideo(avatar.videoUrl);

      const fileName = toFileName(avatar.id);
      const filePath = path.join(HOOKS_FOLDER, fileName);
      await downloadHookVideo(latestUrl, filePath);
      const localUrl = `${HOOKS_PREFIX}/${fileName}`;

      await db.reactionAvatar.update({
        where: { id: avatar.id },
        data: { videoUrl: localUrl },
      });

      results.push({ id: avatar.id, videoUrl: localUrl });
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: "No avatars processed" },
        { status: 500 },
      );
    }

    const firstResult = results[0];

    return NextResponse.json({
      ok: true,
      results,
      videoUrl: firstResult?.videoUrl,
      usedMode: targetMode,
    });
  } catch (error) {
    console.error("[admin.reaction-avatars.generate] error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const isCapacity =
      /No available models/i.test(message) ||
      /err_code["']?\s*:\s*-?10008/.test(message) ||
      /capacity/i.test(message);
    return NextResponse.json(
      {
        error: isCapacity
          ? "302.ai Kling STD meldet aktuell: No available models."
          : message,
      },
      { status: isCapacity ? 503 : 500 },
    );
  }
}
