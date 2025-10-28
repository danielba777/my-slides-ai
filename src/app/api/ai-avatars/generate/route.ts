import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";
import { ensureAndConsumeCredits } from "@/server/billing";

const API_BASE = "https://api.302.ai";
const GENERATE_ENDPOINT = `${API_BASE}/higgsfield/text2image_soul`;
const FETCH_ENDPOINT = (id: string) =>
  `${API_BASE}/higgsfield/task/${encodeURIComponent(id)}/fetch`;
const EXPECTED_GENERATION_BATCH_SIZE = 4;
const DEFAULT_STYLE_ID = "1cb4b936-77bf-4f9a-9039-f3d349a4cdbe";

type ImageResult = { minUrl?: string; rawUrl?: string };
type PersistedImage = {
  id: string;
  prompt: string;
  imageUrl: string;
  rawImageUrl?: string | null;
  createdAt: string;
  jobId?: string | null;
};

type GenerationJobResponse = {
  id: string;
  startedAt: string;
  expectedImages: number;
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { prompt, styleId, quality } = (await request.json()) as {
      prompt?: string;
      styleId?: string;
      quality?: "basic" | "high";
    };

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const trimmedPrompt = prompt.trim();
    const effectiveStyleId =
      typeof styleId === "string" && styleId.trim().length > 0
        ? styleId.trim()
        : DEFAULT_STYLE_ID;
    const effectiveQuality: "basic" | "high" =
      quality === "high" || quality === "basic" ? quality : "high";
    const apiKey = process.env["302AI_KEY"];
    if (!apiKey) {
      return NextResponse.json(
        { error: "302AI_KEY environment variable is missing" },
        { status: 500 },
      );
    }

    const job = await createGenerationJob({
      prompt: trimmedPrompt,
      expectedImages: EXPECTED_GENERATION_BATCH_SIZE,
      userId: session.user.id,
    });

    if (!job?.id) {
      throw new Error("Failed to create generation job");
    }

    void processGenerationJob({
      externalApiKey: apiKey,
      jobId: job.id,
      prompt: trimmedPrompt,
      expectedImages: job.expectedImages ?? EXPECTED_GENERATION_BATCH_SIZE,
      userId: session.user.id,
      styleId: effectiveStyleId,
      quality: effectiveQuality,
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        startedAt: job.startedAt,
        expectedImages: job.expectedImages ?? EXPECTED_GENERATION_BATCH_SIZE,
      },
    });
  } catch (error) {
    console.error("AI avatar generation failed to start", error);
    return NextResponse.json(
      { error: "Failed to initiate avatar generation" },
      { status: 500 },
    );
  }
}

async function processGenerationJob({
  externalApiKey,
  jobId,
  prompt,
  expectedImages,
  userId,
  styleId,
  quality,
}: {
  externalApiKey: string;
  jobId: string;
  prompt: string;
  expectedImages: number;
  userId: string;
  styleId: string;
  quality: "basic" | "high";
}) {
  const randomSeed = Math.floor(Math.random() * 1_000_000);
  // Vor Start atomar 2 AI-Credits abziehen
  try {
    await ensureAndConsumeCredits(userId, { kind: "ai", cost: 2 });
  } catch (e: any) {
    if (e?.code === "INSUFFICIENT_AI_CREDITS") {
      return NextResponse.json(
        { error: "Not enough AI credits", upgradeUrl: "/#pricing" },
        { status: 402 },
      );
    }
    throw e;
  }

  const payload = {
    quality,
    aspect_ratio: "2:3",
    prompt,
    negative_prompt: "",
    enhance_prompt: false,
    seed: randomSeed,
    style_id: styleId,
  };

  try {
    console.debug("[AI Avatar] Sending generation request", {
      url: GENERATE_ENDPOINT,
      payload,
    });

    const jobResponse = await fetch(GENERATE_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${externalApiKey}`,
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
      await updateGenerationJobStatus(jobId, "FAILED", {
        errorMessage:
          (jobJson?.message as string | undefined) ??
          "Failed to start avatar generation",
      });
      return;
    }

    const fetchResult = await pollForResult(jobJson.id, externalApiKey);

    let persistedCount = 0;
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
        prompt,
        sourceUrl,
        rawImageUrl: image.rawUrl ?? null,
        userId,
        jobId,
      });
      if (saved?.id) {
        persistedCount += 1;
      }
    }

    if (persistedCount === 0) {
      await updateGenerationJobStatus(jobId, "FAILED", {
        errorMessage: "No generated images could be stored",
      });
      return;
    }

    await updateGenerationJobStatus(jobId, "COMPLETED", {
      expectedImages,
    });
  } catch (error) {
    console.error("[AI Avatar] Generation job failed", error);
    await updateGenerationJobStatus(jobId, "FAILED", {
      errorMessage:
        error instanceof Error ? error.message : "Generation job failed",
    });
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

async function createGenerationJob({
  prompt,
  expectedImages,
  userId,
}: {
  prompt: string;
  expectedImages: number;
  userId: string;
}): Promise<GenerationJobResponse | null> {
  const response = await fetch(
    `${env.SLIDESCOCKPIT_API}/ai-avatars/generations/jobs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({
        prompt,
        expectedImages,
      }),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    console.error("[AI Avatar] Failed to create generation job", {
      status: response.status,
      data,
    });
    throw new Error("Failed to create generation job");
  }

  return data as GenerationJobResponse;
}

async function updateGenerationJobStatus(
  jobId: string,
  status: "COMPLETED" | "FAILED",
  payload: { errorMessage?: string; expectedImages?: number },
) {
  try {
    const response = await fetch(
      `${env.SLIDESCOCKPIT_API}/ai-avatars/generations/jobs/${jobId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          errorMessage: payload.errorMessage,
        }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      console.error("[AI Avatar] Failed to update job status", {
        status: response.status,
        data,
      });
    }
  } catch (error) {
    console.error("[AI Avatar] Error updating job status", error);
  }
}

async function persistGeneratedImage({
  prompt,
  sourceUrl,
  rawImageUrl,
  userId,
  jobId,
}: {
  prompt: string;
  sourceUrl: string;
  rawImageUrl: string | null;
  userId: string;
  jobId: string;
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
      jobId,
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
