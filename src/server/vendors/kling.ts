// Lightweight client for Kling MultiImage2Video via a configurable proxy.
// Env:
//   KLING_PROXY_URL  (required)  -> POST accepts { imageUrl, prompt, durationSeconds, aspectRatio }
//                                  Responds either { videoUrl } OR { taskId } for async.
//   KLING_API_KEY    (optional)  -> sent as Authorization: Bearer ...
//
// We keep it generic so you can point to any proxy that wraps Kling's API.

const KLING_BASE = process.env.KLING_PROXY_URL;
const KLING_KEY = process.env.KLING_API_KEY;

type SubmitReq = {
  imageUrl: string;
  prompt: string;
  durationSeconds?: number;
  aspectRatio?: "9:16" | "16:9" | "1:1";
};

type SubmitResp =
  | { videoUrl?: string; taskId?: string }
  | { result?: { videoUrl?: string; taskId?: string } };

type StatusResp =
  | { status?: "pending" | "processing" | "succeeded" | "failed"; videoUrl?: string; error?: string }
  | { result?: { status?: "pending" | "processing" | "succeeded" | "failed"; videoUrl?: string; error?: string } };

async function httpJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (KLING_KEY) headers.Authorization = `Bearer ${KLING_KEY}`;
  const resp = await fetch(url, { ...(init ?? {}), headers });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Kling proxy error: ${resp.status} ${resp.statusText} ${text || ""}`.trim());
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

function pick<T>(...vals: (T | undefined)[]) {
  return vals.find((v) => v !== undefined);
}

export async function createKlingHook(
  imageUrl: string,
  prompt: string,
  opts?: { durationSeconds?: number; aspectRatio?: "9:16" | "16:9" | "1:1" },
): Promise<string> {
  if (!KLING_BASE) throw new Error("Missing KLING_PROXY_URL in environment");

  const durationSeconds = Math.max(1, Math.min(30, Math.floor(opts?.durationSeconds ?? 5)));
  const aspectRatio = opts?.aspectRatio ?? "9:16";

  // Submit
  const submit = await httpJson<SubmitResp>(KLING_BASE, {
    method: "POST",
    body: JSON.stringify({ imageUrl, prompt, durationSeconds, aspectRatio } as SubmitReq),
  });
  const direct = pick(submit.videoUrl, submit.result?.videoUrl);
  if (direct) return direct!;

  const taskId = pick(submit.taskId, submit.result?.taskId);
  if (!taskId) throw new Error("Kling submit returned neither videoUrl nor taskId");

  const statusUrl = KLING_BASE.replace(/\/+$/, "") + `/status?taskId=${encodeURIComponent(taskId)}`;
  const t0 = Date.now();
  const TIMEOUT = 90_000;
  while (Date.now() - t0 < TIMEOUT) {
    await new Promise((r) => setTimeout(r, 2000));
    const st = await httpJson<StatusResp>(statusUrl, { method: "GET" });
    const status = pick(st.status, st.result?.status) ?? "pending";
    const url = pick(st.videoUrl, st.result?.videoUrl);
    const err = pick(st.error, st.result?.error);
    if (status === "failed") throw new Error(`Kling job failed: ${err ?? "unknown"}`);
    if (status === "succeeded" && url) return url;
  }
  throw new Error("Kling job polling timed out");
}

export const KLING_MODEL_NAME = "kling-multiimage2video";