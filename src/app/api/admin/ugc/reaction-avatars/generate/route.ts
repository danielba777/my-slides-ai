import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { createPikaImageToVideo } from "@/server/vendors/fal";

const toFileName = (avatarId: string) => `${avatarId}-${randomUUID()}.mp4`;

const uploadVideoToFileServer = async (videoUrl: string, fileName: string): Promise<string> => {
  // 1. Get presigned URL from slidescockpit-api
  const apiBaseUrl = process.env.SLIDESCOCKPIT_API_BASE_URL ?? "http://localhost:3001";
  const presignResponse = await fetch(`${apiBaseUrl}/files/presign?key=ugc/reaction-hooks/${fileName}&contentType=video/mp4`);

  if (!presignResponse.ok) {
    throw new Error(`Failed to get upload URL: ${presignResponse.status}`);
  }

  const presignData = await presignResponse.json();
  if (!presignData.uploadUrl) {
    throw new Error("No upload URL received");
  }

  // 2. Download video from fal.ai
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const videoBuffer = await response.arrayBuffer();

  // 3. Upload to S3
  const uploadResponse = await fetch(presignData.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
    },
    body: videoBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload video: ${uploadResponse.status}`);
  }

  return presignData.publicUrl;
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
        throw new Error("fal.ai returned no video URL");
      }

      const fileName = toFileName(avatar.id);
      const fileServerUrl = await uploadVideoToFileServer(latestUrl, fileName);

      await db.reactionAvatar.update({
        where: { id: avatar.id },
        data: { videoUrl: fileServerUrl },
      });

      results.push({ id: avatar.id, videoUrl: fileServerUrl });
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
