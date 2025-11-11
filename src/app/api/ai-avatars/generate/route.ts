import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";
import { ensureAndConsumeCredits } from "@/server/billing";
import { db } from "@/server/db";

const API_BASE = "https://api.302.ai";
const GENERATE_ENDPOINT = `${API_BASE}/higgsfield/text2image_soul`;
const FETCH_ENDPOINT = (id: string) =>
  `${API_BASE}/higgsfield/task/${encodeURIComponent(id)}/fetch`;
const EXPECTED_GENERATION_BATCH_SIZE = 4;
const DEFAULT_STYLE_ID = "1cb4b936-77bf-4f9a-9039-f3d349a4cdbe";

async function ensureUserExists(userId: string, session: any) {
  const existingUser = await db.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    // Create user in database
    await db.user.create({
      data: {
        id: userId,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        hasAccess: true, // Give new users access by default
      },
    });
  }
}

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

    // Ensure user exists in database
    await ensureUserExists(userId, session);

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
    const apiKey = env["302AI_KEY"];
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI Avatar generation is currently unavailable" },
        { status: 503 }
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
  const creditCost = quality === "basic" ? 1 : 2;
  // Vor Start atomar Credits abziehen (1 bei basic, 2 bei high)
  try {
    await ensureAndConsumeCredits(userId, { kind: "ai", cost: creditCost });
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

      try {
        const saved = await persistGeneratedImage({
          prompt,
          sourceUrl,
          fallbackUrl:
            image.rawUrl && image.minUrl && image.rawUrl !== image.minUrl
              ? image.minUrl
              : null,
          rawImageUrl: image.rawUrl ?? null,
          userId,
          jobId,
        });
        if (saved?.id) {
          persistedCount += 1;
        }
      } catch (error) {
        console.error("[AI Avatar] Failed to persist image", {
          sourceUrl,
          error,
        });
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

async function downloadImageWithRetry(url: string, maxRetries = 3): Promise<ArrayBuffer> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AI Avatar] Downloading image from ${url} (attempt ${attempt}/${maxRetries})`);
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Referer': 'https://302.ai/',
        },
      });

      if (response.ok) {
        return await response.arrayBuffer();
      }

      console.warn(`[AI Avatar] Download attempt ${attempt} failed with status ${response.status}`);

      if (attempt === maxRetries) {
        throw new Error(`Failed to download image after ${maxRetries} attempts (last status: ${response.status})`);
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));

    } catch (error) {
      console.warn(`[AI Avatar] Download attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('Unexpected error in download retry logic');
}

async function persistGeneratedImage({
  prompt,
  sourceUrl,
  fallbackUrl,
  rawImageUrl,
  userId,
  jobId,
}: {
  prompt: string;
  sourceUrl: string;
  fallbackUrl: string | null;
  rawImageUrl: string | null;
  userId: string;
  jobId: string;
}): Promise<PersistedImage> {
  // Download the image first with retry logic
  let imageBuffer: ArrayBuffer;
  try {
    imageBuffer = await downloadImageWithRetry(sourceUrl);
  } catch (primaryError) {
    if (fallbackUrl && fallbackUrl !== sourceUrl) {
      console.warn(
        "[AI Avatar] Primary download failed, trying fallback URL",
        {
          sourceUrl,
          fallbackUrl,
        },
      );
      imageBuffer = await downloadImageWithRetry(fallbackUrl);
    } else {
      throw primaryError;
    }
  }

  // Send to API with image buffer
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('rawImageUrl', rawImageUrl || '');
  formData.append('jobId', jobId || '');
  formData.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), 'generated-image.jpg');

  const response = await fetch(`${env.SLIDESCOCKPIT_API}/ai-avatars/generations`, {
    method: "POST",
    headers: {
      "x-user-id": userId,
    },
    body: formData,
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
