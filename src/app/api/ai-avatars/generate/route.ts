import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

const API_BASE = "https://api.302.ai";
const GENERATE_ENDPOINT = `${API_BASE}/higgsfield/text2image_soul`;
const FETCH_ENDPOINT = (id: string) =>
  `${API_BASE}/higgsfield/task/${encodeURIComponent(id)}/fetch`;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = (await request.json()) as { prompt?: string };

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env["302AI_KEY"];
    if (!apiKey) {
      return NextResponse.json(
        { error: "302AI_KEY environment variable is missing" },
        { status: 500 },
      );
    }

    const payload = {
      quality: "basic",
      aspect_ratio: "2:3",
      prompt: prompt.trim(),
      negative_prompt: "",
      enhance_prompt: false,
      seed: 38459,
      style_id: "1cb4b936-77bf-4f9a-9039-f3d349a4cdbe",
    };

    console.debug("[AI Avatar] Sending generation request", {
      url: GENERATE_ENDPOINT,
      payload,
    });

    const jobResponse = await fetch(GENERATE_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const jobJson = await jobResponse.json().catch(() => ({}));
    if (!jobResponse.ok || typeof jobJson.id !== "string") {
      console.error("[AI Avatar] Generation start failed", {
        status: jobResponse.status,
        jobJson,
      });
      return NextResponse.json(
        { error: "Failed to start avatar generation", detail: jobJson },
        { status: jobResponse.status || 502 },
      );
    }

    const fetchResult = await pollForResult(jobJson.id, apiKey);

    const persistedImages = [];
    for (const image of fetchResult.images) {
      const sourceUrl = image.rawUrl ?? image.minUrl;
      if (!sourceUrl) {
        console.warn(
          "[AI Avatar] Skipping image persistence due to missing URL",
          image,
        );
        continue;
      }

      const saved = await persistGeneratedImage({
        prompt: prompt.trim(),
        sourceUrl,
        rawImageUrl: image.rawUrl ?? null,
        userId: session.user.id,
      });
      persistedImages.push(saved);
    }

    if (persistedImages.length === 0) {
      return NextResponse.json(
        { error: "No generated images could be stored" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      id: jobJson.id,
      images: persistedImages,
      raw: fetchResult.raw,
    });
  } catch (error) {
    console.error("AI avatar generation failed", error);
    return NextResponse.json(
      { error: "Failed to generate avatar" },
      { status: 500 },
    );
  }
}

async function pollForResult(id: string, apiKey: string) {
  const delayMs = 2000;

  let attempt = 0;

  while (true) {
    const response = await fetch(FETCH_ENDPOINT(id), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    console.debug("[AI Avatar] Poll response", {
      attempt,
      data,
    });
    const images = extractImages(data);

    if (images.length > 0) {
      return { images, raw: data };
    }

    const aggregateStatus = (data as any)?.status ?? (data as any)?.task_state;
    const jobStatuses = Array.isArray((data as any)?.jobs)
      ? (data as any).jobs.map((job: any) => job?.status).filter(Boolean)
      : [];

    const failureStatuses = ["failed", "canceled", "cancelled"];
    if (
      (aggregateStatus && failureStatuses.includes(aggregateStatus)) ||
      (jobStatuses.length > 0 &&
        jobStatuses.every((status: string) => failureStatuses.includes(status)))
    ) {
      throw new Error("Generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    attempt += 1;
  }
}

type ImageResult = { minUrl?: string; rawUrl?: string };
type PersistedImage = {
  id: string;
  prompt: string;
  imageUrl: string;
  rawImageUrl?: string | null;
  createdAt: string;
};

function extractImages(data: any): ImageResult[] {
  if (!data) return [];

  if (Array.isArray(data?.jobs) && data.jobs.length > 0) {
    return data.jobs
      .map((job: any) => {
        const minUrl =
          job?.results?.min?.url ??
          (typeof job?.results?.min === "string" ? job.results.min : undefined);
        const rawUrl =
          job?.results?.raw?.url ??
          (typeof job?.results?.raw === "string" ? job.results.raw : undefined);
        return minUrl || rawUrl ? { minUrl, rawUrl } : null;
      })
      .filter((item: ImageResult | null): item is ImageResult => !!item);
  }

  const fallback = [
    data?.result?.output?.[0]?.url,
    data?.result?.output?.[0],
    data?.output?.[0]?.url,
    data?.output?.[0],
    data?.result?.image,
    data?.image,
  ].find((value) => typeof value === "string");

  return fallback ? [{ minUrl: fallback }] : [];
}

async function persistGeneratedImage({
  prompt,
  sourceUrl,
  rawImageUrl,
  userId,
}: {
  prompt: string;
  sourceUrl: string;
  rawImageUrl: string | null;
  userId: string;
}): Promise<PersistedImage> {
  const response = await fetch(`${env.SLIDESCOCKPIT_API}/ai-avatars/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify({
      prompt,
      sourceUrl,
      rawImageUrl,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    console.error("[AI Avatar] Failed to persist generated image", {
      status: response.status,
      data,
    });
    throw new Error("Failed to store generated image");
  }

  return data as PersistedImage;
}
