"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

export type TikTokPostStatus =
  | "QUEUE"
  | "SCHEDULED"
  | "RUNNING"
  | "PUBLISHED"
  | "INBOX"
  | "FAILED"
  | "CANCELLED";

interface TikTokPostMedia {
  type: string;
  url?: string;
  [key: string]: unknown;
}

interface TikTokPostSettings {
  [key: string]: unknown;
}

export interface TikTokPostRecord {
  id: string;
  userId: string;
  platform: string;
  targetOpenId: string;
  payload: {
    caption?: string;
    media?: TikTokPostMedia[];
    postMode?: string;
    settings?: TikTokPostSettings;
  };
  status: TikTokPostStatus;
  runAt: string | null;
  jobId: string | null;
  publishId: string | null;
  resultUrl: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

async function fetchTikTokPosts(openId?: string): Promise<TikTokPostRecord[]> {
  const params = new URLSearchParams();
  if (openId) {
    params.set("openId", openId);
  }

  const endpoint = `/api/tiktok/posts${params.size > 0 ? `?${params.toString()}` : ""}`;
  const response = await fetch(endpoint, { cache: "no-store" });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !Array.isArray(payload)) {
    const message =
      payload &&
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "Unable to load TikTok posts";
    throw new Error(message);
  }

  return payload.map((raw: Record<string, unknown>) => normalizePostRecord(raw));
}

function normalizePostRecord(raw: Record<string, unknown>): TikTokPostRecord {
  const payload = (raw.payload && typeof raw.payload === "object" ? raw.payload : {}) as Record<string, unknown>;
  const media = Array.isArray(payload.media)
    ? (payload.media.filter((item) => item && typeof item === "object") as TikTokPostMedia[])
    : [];

  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? ""),
    platform: String(raw.platform ?? ""),
    targetOpenId: String(raw.targetOpenId ?? raw.openId ?? ""),
    payload: {
      caption: typeof payload.caption === "string" ? payload.caption : undefined,
      media,
      postMode: typeof payload.postMode === "string" ? payload.postMode : undefined,
      settings:
        payload.settings && typeof payload.settings === "object"
          ? (payload.settings as TikTokPostSettings)
          : undefined,
    },
    status: (typeof raw.status === "string" ? raw.status : "FAILED") as TikTokPostStatus,
    runAt: typeof raw.runAt === "string" ? raw.runAt : null,
    jobId: typeof raw.jobId === "string" ? raw.jobId : null,
    publishId: typeof raw.publishId === "string" ? raw.publishId : null,
    resultUrl: typeof raw.resultUrl === "string" ? raw.resultUrl : null,
    attempts: typeof raw.attempts === "number" ? raw.attempts : 0,
    lastError: typeof raw.lastError === "string" ? raw.lastError : null,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

interface UseTikTokPostsOptions {
  openId?: string;
  statuses?: TikTokPostStatus[];
  refetchIntervalMs?: number;
}

interface UseTikTokPostsResult {
  posts: TikTokPostRecord[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTikTokPosts({
  openId,
  statuses,
  refetchIntervalMs = 5_000,
}: UseTikTokPostsOptions = {}): UseTikTokPostsResult {
  const query = useQuery({
    queryKey: ["tiktok-posts", openId ?? null],
    queryFn: () => fetchTikTokPosts(openId),
    refetchInterval: refetchIntervalMs,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const filteredPosts = useMemo(() => {
    if (!query.data) return [];
    if (!statuses || statuses.length === 0) return query.data;
    const statusSet = new Set(statuses);
    return query.data.filter((post) => statusSet.has(post.status));
  }, [query.data, statuses]);

  return {
    posts: filteredPosts,
    loading: query.isLoading,
    refreshing: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: async () => {
      await query.refetch();
    },
  };
}
