/**
 * Lightweight 302.ai client for Avatar-4 (best price/perf for TikTok-style talking heads).
 * Safe for Next.js: no Node core imports; no top-level env throws.
 */
// Simple sleep helper (Edge/Webpack safe)
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const BASE = process.env.THREE02_API_BASE ?? "https://api.302.ai";
// NOTE: don't throw at module load; access and validate inside functions
const getApiKey = () => process.env["302AI_KEY"];

type CreateJobReq = {
  model: "avatar-4";
  prompt: string;
  image_url: string;
  duration_seconds: number;
};

type CreateJobRes = {
  job_id: string;
};

type JobStatusRes = {
  status: "queued" | "processing" | "succeeded" | "failed";
  output_url?: string;
  error?: string;
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const API_KEY = getApiKey();
  if (!API_KEY) throw new Error("Missing 302AI_KEY in environment");
  const resp = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...init?.headers,
    },
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "Unknown error");
    throw new Error(`302.ai request failed: ${resp.status} ${txt}`);
  }
  return resp.json() as Promise<T>;
}

export async function createAvatar4Hook(
  imageUrl: string,
  prompt: string,
  { durationSeconds = 5, pollMs = 2500, maxWaitMs = 2 * 60_000 } = {},
): Promise<string> {
  const API_KEY = getApiKey();
  if (!API_KEY) throw new Error("Missing 302AI_KEY in environment");
  const body: CreateJobReq = {
    model: "avatar-4",
    prompt,
    image_url: imageUrl,
    duration_seconds: durationSeconds,
  };
  const create = await http<CreateJobRes>("/v1/video/create", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const started = Date.now();
  // simple polling – robust and minimal
  while (Date.now() - started < maxWaitMs) {
    const st = await http<JobStatusRes>(`/v1/video/${create.job_id}`);
    if (st.status === "succeeded" && st.output_url) {
      return st.output_url;
    }
    if (st.status === "failed") {
      throw new Error(st.error || "302.ai job failed");
    }
    await sleep(pollMs);
  }
  throw new Error("302.ai job timed out");
}

// (kein Export von three02Info mehr nötig – vermeidet versehentlichen Client-Import)