"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "sonner";

import { useTikTokAccounts } from "@/hooks/use-tiktok-accounts";

export type TikTokPostMediaType = "video" | "photo";
export type TikTokPostMode = "INBOX" | "PUBLISH" | "DIRECT_POST" | "MEDIA_UPLOAD";
export type TikTokContentPostingMethod =
  | "UPLOAD"
  | "MEDIA_UPLOAD"
  | "DIRECT_POST"
  | "URL";

export interface TikTokPostPayload {
  openId: string;
  caption: string;
  mediaUrl: string;
  mediaType: TikTokPostMediaType;
  thumbnailTimestampMs?: number;
  autoAddMusic: boolean;
  postMode: TikTokPostMode;
  contentPostingMethod: TikTokContentPostingMethod;
}

export interface TikTokPostResult {
  publishId: string;
  status: "processing" | "success" | "failed" | "inbox";
  postId?: string;
  releaseUrl?: string;
  error?: string;
}

interface PostStartResponse {
  accepted: boolean;
  publishId: string;
  status: "processing";
}

interface StatusResponse {
  status: "processing" | "success" | "failed" | "inbox";
  postId?: string;
  releaseUrl?: string;
  error?: string;
}

const DEFAULT_FORM_VALUES: TikTokPostPayload = {
  openId: "",
  caption: "",
  mediaUrl: "",
  mediaType: "video",
  thumbnailTimestampMs: 1000,
  autoAddMusic: true,
  postMode: "PUBLISH",
  contentPostingMethod: "UPLOAD",
};

export interface UseTikTokPostActionOptions {
  defaultValues?: Partial<TikTokPostPayload>;
}

export interface UseTikTokPostActionResult {
  form: TikTokPostPayload;
  setForm: Dispatch<SetStateAction<TikTokPostPayload>>;
  updateField: <K extends keyof TikTokPostPayload>(
    key: K,
    value: TikTokPostPayload[K],
  ) => void;
  submitting: boolean;
  result: TikTokPostResult | null;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  handleSubmit: () => Promise<void>;
  reset: (values?: Partial<TikTokPostPayload>) => void;
  accounts: ReturnType<typeof useTikTokAccounts>["accounts"];
  accountsLoading: boolean;
  refreshAccounts: ReturnType<typeof useTikTokAccounts>["refresh"];
}

export function useTikTokPostAction(
  options: UseTikTokPostActionOptions = {},
): UseTikTokPostActionResult {
  const initialForm = useMemo(
    () => ({ ...DEFAULT_FORM_VALUES, ...options.defaultValues }),
    [options.defaultValues],
  );
  const [form, setForm] = useState<TikTokPostPayload>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TikTokPostResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    accounts,
    loading: accountsLoading,
    error: accountsError,
    refresh: refreshAccounts,
  } = useTikTokAccounts();

  useEffect(() => {
    if (accountsError) {
      toast.error(accountsError);
    }
  }, [accountsError]);

  useEffect(() => {
    if (accounts.length === 0) {
      setForm((prev) => ({ ...prev, openId: "" }));
      return;
    }

    setForm((prev) => {
      const exists = accounts.some((account) => account.openId === prev.openId);
      if (exists) {
        return prev;
      }
      const fallback = accounts[0];
      if (!fallback) {
        return prev;
      }
      return { ...prev, openId: fallback.openId };
    });
  }, [accounts]);

  const updateField = useCallback(
    <K extends keyof TikTokPostPayload>(key: K, value: TikTokPostPayload[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const pollStatus = useCallback(
    async (openId: string, publishId: string): Promise<StatusResponse> => {
      const MAX_ATTEMPTS = 30;
      const DELAY_MS = 5_000;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const response = await fetch(
          `/api/tests/tiktok-post/status?openId=${encodeURIComponent(openId)}&publishId=${encodeURIComponent(publishId)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json().catch(() => null)) as
          | StatusResponse
          | { error?: string }
          | null;

        if (!response.ok || !payload || typeof payload !== "object" || !("status" in payload)) {
          const message =
            payload &&
            typeof payload === "object" &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "Could not fetch TikTok status";
          throw new Error(message);
        }

        if (payload.status !== "processing") {
          return payload;
        }

        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }

      throw new Error(
        'TikTok status remained in "processing". Please try again later.',
      );
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!form.openId) {
      toast.error("Please select a connected TikTok account");
      return;
    }

    if (!form.mediaUrl) {
      toast.error("Please provide a media URL from the files bucket");
      return;
    }

    const requestBody = {
      openId: form.openId,
      caption: form.caption,
      mediaUrl: form.mediaUrl,
      mediaType: form.mediaType,
      thumbnailTimestampMs: form.thumbnailTimestampMs,
      autoAddMusic: form.autoAddMusic,
      postMode: form.postMode,
      contentPostingMethod: form.contentPostingMethod,
    };

    console.debug("[TikTokPost] Payload", requestBody);

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/tests/tiktok-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const rawResponseText = await response.text();
      let payload: PostStartResponse | { error?: string } | null = null;
      try {
        payload = JSON.parse(rawResponseText) as
          | PostStartResponse
          | { error?: string }
          | null;
      } catch {
        payload = null;
      }

      if (!response.ok || !payload || typeof payload !== "object" || !("status" in payload)) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : rawResponseText || "TikTok posting failed";
        console.error("[TikTokPost] Request failed", {
          status: response.status,
          statusText: response.statusText,
          body: rawResponseText,
        });
        setError(message);
        toast.error(message);
        return;
      }

      if ("accepted" in payload && payload.accepted) {
        setResult({ publishId: payload.publishId, status: payload.status });
        toast.success("TikTok post started – polling status");

        try {
          const finalStatus = await pollStatus(form.openId, payload.publishId);
          const nextResult: TikTokPostResult = {
            publishId: payload.publishId,
            status: finalStatus.status,
            postId: finalStatus.postId ?? payload.publishId,
            releaseUrl: finalStatus.releaseUrl,
          };
          setResult(nextResult);

          if (finalStatus.status === "success") {
            toast.success("TikTok post published successfully");
          } else if (finalStatus.status === "inbox") {
            toast.success("TikTok post saved to TikTok Inbox drafts");
          } else if (finalStatus.status === "failed") {
            toast.error(
              finalStatus.error ??
                "TikTok post was rejected by TikTok. Check console for details.",
            );
            console.error("[TikTokPost] Final status failure", finalStatus);
          }
        } catch (pollError) {
          const message =
            pollError instanceof Error
              ? pollError.message
              : "Could not fetch TikTok status";
          setError(message);
          toast.error(message);
        }
        return;
      }

      setResult({
        publishId: payload.publishId ?? "",
        status: payload.status,
      });
    } catch (err) {
      console.error("[TikTokPost] Unexpected error", err, { requestBody });
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [form, pollStatus]);

  const reset = useCallback(
    (values?: Partial<TikTokPostPayload>) => {
      setForm({ ...DEFAULT_FORM_VALUES, ...options.defaultValues, ...values });
      setResult(null);
      setError(null);
      setSubmitting(false);
    },
    [options.defaultValues],
  );

  return {
    form,
    setForm,
    updateField,
    submitting,
    result,
    error,
    setError,
    handleSubmit,
    reset,
    accounts,
    accountsLoading,
    refreshAccounts,
  };
}
