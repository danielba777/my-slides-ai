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

export type TikTokScheduleMediaType = "photo" | "video";
export type TikTokSchedulePostMode =
  | "INBOX"
  | "PUBLISH"
  | "DIRECT_POST"
  | "MEDIA_UPLOAD";
export type TikTokSchedulePostingMethod =
  | "UPLOAD"
  | "MEDIA_UPLOAD"
  | "DIRECT_POST"
  | "URL";

export interface TikTokSchedulePayload {
  openId: string;
  caption: string;
  mediaUrl: string;
  mediaType: TikTokScheduleMediaType;
  thumbnailTimestampMs?: number;
  autoAddMusic: boolean;
  postMode: TikTokSchedulePostMode;
  contentPostingMethod: TikTokSchedulePostingMethod;
  publishAt: string;
  idempotencyKey: string;
}

export interface TikTokScheduleResult {
  scheduled: boolean;
  runAt: string;
  jobKey: string;
}

interface UseTikTokScheduleActionOptions {
  defaultValues?: Partial<TikTokSchedulePayload>;
}

export interface UseTikTokScheduleActionResult {
  form: TikTokSchedulePayload;
  setForm: Dispatch<SetStateAction<TikTokSchedulePayload>>;
  updateField: <K extends keyof TikTokSchedulePayload>(
    key: K,
    value: TikTokSchedulePayload[K],
  ) => void;
  submitting: boolean;
  result: TikTokScheduleResult | null;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  handleSubmit: () => Promise<void>;
  reset: (values?: Partial<TikTokSchedulePayload>) => void;
  accounts: ReturnType<typeof useTikTokAccounts>["accounts"];
  accountsLoading: boolean;
  refreshAccounts: ReturnType<typeof useTikTokAccounts>["refresh"];
  resetIdempotencyKey: () => void;
}

const createDefaultPublishAt = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  return now.toISOString().slice(0, 16);
};

const DEFAULT_SCHEDULE_VALUES: TikTokSchedulePayload = {
  openId: "",
  caption: "",
  mediaUrl: "",
  mediaType: "photo",
  autoAddMusic: true,
  postMode: "INBOX",
  contentPostingMethod: "MEDIA_UPLOAD",
  publishAt: createDefaultPublishAt(),
  idempotencyKey: `schedule_${Date.now()}`,
};

export function useTikTokScheduleAction(
  options: UseTikTokScheduleActionOptions = {},
): UseTikTokScheduleActionResult {
  const initialForm = useMemo(() => {
    const merged = {
      ...DEFAULT_SCHEDULE_VALUES,
      ...options.defaultValues,
    };
    // Ensure publishAt always has a value
    if (!merged.publishAt) {
      merged.publishAt = createDefaultPublishAt();
    }
    if (!merged.idempotencyKey) {
      merged.idempotencyKey = `schedule_${Date.now()}`;
    }
    return merged;
  }, [options.defaultValues]);

  const [form, setForm] = useState<TikTokSchedulePayload>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TikTokScheduleResult | null>(null);
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
    <K extends keyof TikTokSchedulePayload>(
      key: K,
      value: TikTokSchedulePayload[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetIdempotencyKey = useCallback(() => {
    updateField("idempotencyKey", `schedule_${Date.now()}`);
  }, [updateField]);

  const handleSubmit = useCallback(async () => {
    if (!form.openId) {
      toast.error("Please select a connected TikTok account");
      return;
    }

    if (!form.mediaUrl) {
      toast.error("Please provide a media URL from the files bucket");
      return;
    }

    if (!form.publishAt) {
      toast.error("Please pick a publish date");
      return;
    }

    if (!form.idempotencyKey.trim()) {
      toast.error("Please provide an idempotency key");
      return;
    }

    const publishDate = new Date(form.publishAt);
    if (Number.isNaN(publishDate.getTime())) {
      toast.error("Invalid date");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    const media =
      form.mediaType === "photo"
        ? [{ type: "photo" as const, url: form.mediaUrl }]
        : [
            {
              type: "video" as const,
              url: form.mediaUrl,
              thumbnailTimestampMs: form.thumbnailTimestampMs ?? 1000,
            },
          ];

    const payload = {
      openId: form.openId,
      publishAt: publishDate.toISOString(),
      idempotencyKey: form.idempotencyKey,
      post: {
        caption: form.caption,
        postMode: form.postMode,
        media,
        settings: {
          contentPostingMethod: form.contentPostingMethod,
          privacyLevel: "SELF_ONLY" as const,
          duet: false,
          comment: false,
          stitch: false,
          autoAddMusic: form.autoAddMusic,
          videoMadeWithAi: false,
          brandContentToggle: false,
          brandOrganicToggle: false,
        },
      },
    };

    try {
      const response = await fetch("/api/tests/tiktok-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | TikTokScheduleResult
        | { error?: string }
        | null;

      if (!response.ok || !data || typeof data !== "object" || !("scheduled" in data)) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "TikTok scheduling failed";
        setError(message);
        toast.error(message);
        return;
      }

      setResult(data);
      toast.success("TikTok post was scheduled successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  const reset = useCallback(
    (values?: Partial<TikTokSchedulePayload>) => {
      setForm({ ...DEFAULT_SCHEDULE_VALUES, ...options.defaultValues, ...values });
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
    resetIdempotencyKey,
  };
}
