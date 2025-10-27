import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { ensureAndConsumeCredits } from "@/server/billing";

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
    const userId = session.user.id;
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

    return NextResponse.json({
      success: true,
      id: jobJson.id,
      images: fetchResult.images,
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
  const maxAttempts = 40;
  const delayMs = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
  }

  throw new Error("Avatar generation timed out");
}

type ImageResult = { minUrl?: string; rawUrl?: string };

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
