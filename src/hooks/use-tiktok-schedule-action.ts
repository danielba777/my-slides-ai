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

export interface TikTokSchedulePayload {
  openId: string;
  caption: string;
  title: string;
  coverIndex: number;
  photoImages: string[];
  publishAt: string;
  idempotencyKey: string;
  autoAddMusic?: boolean;
  postMode?: "DIRECT_POST" | "MEDIA_UPLOAD";
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
  handleSubmit: () => Promise<TikTokScheduleResult | null>;
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
  title: "",
  coverIndex: 0,
  photoImages: [],
  publishAt: createDefaultPublishAt(),
  idempotencyKey: `schedule_${Date.now()}`,
  autoAddMusic: true,
  postMode: "MEDIA_UPLOAD",
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

  useEffect(() => {
    setForm((prev) => {
      if (prev.photoImages.length === 0 && prev.coverIndex !== 0) {
        return { ...prev, coverIndex: 0 };
      }
      if (
        prev.photoImages.length > 0 &&
        prev.coverIndex >= prev.photoImages.length
      ) {
        return { ...prev, coverIndex: 0 };
      }
      return prev;
    });
  }, [form.photoImages.length, setForm]);

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

  const handleSubmit = useCallback(async (): Promise<TikTokScheduleResult | null> => {
    if (!form.openId) {
      toast.error("Please select a connected TikTok account");
      return null;
    }

    if (!Array.isArray(form.photoImages) || form.photoImages.length === 0) {
      toast.error("No slide images available for posting");
      return null;
    }

    if (!form.publishAt) {
      toast.error("Please pick a publish date");
      return null;
    }

    if (!form.idempotencyKey.trim()) {
      toast.error("Please provide an idempotency key");
      return null;
    }

    const publishDate = new Date(form.publishAt);
    if (Number.isNaN(publishDate.getTime())) {
      toast.error("Invalid date");
      return null;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    const coverIndex = Math.max(
      0,
      Math.min(form.coverIndex, form.photoImages.length - 1),
    );

    const orderedImages = [...form.photoImages];
    if (coverIndex > 0 && coverIndex < orderedImages.length) {
      const [cover] = orderedImages.splice(coverIndex, 1);
      if (cover) {
        orderedImages.unshift(cover);
      }
    }

    const normalizedTitle = form.title?.trim() ?? "";

    const payload = {
      openId: form.openId,
      publishAt: publishDate.toISOString(),
      idempotencyKey: form.idempotencyKey,
      post: {
        caption: form.caption,
        postMode: "MEDIA_UPLOAD" as const,
        media: orderedImages.map((url) => ({ type: "photo" as const, url })),
        settings: {
          contentPostingMethod: "URL" as const,
          autoAddMusic: true,
          title: normalizedTitle.length > 0 ? normalizedTitle : undefined,
        },
      },
    };

    console.debug("[TikTokSchedule] Payload", payload);

    try {
      const response = await fetch("/api/tests/tiktok-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawResponseText = await response.text();
      let data: TikTokScheduleResult | { error?: string } | null = null;
      try {
        data = JSON.parse(rawResponseText) as
          | TikTokScheduleResult
          | { error?: string }
          | null;
      } catch {
        data = null;
      }

      if (!response.ok || !data || typeof data !== "object" || !("scheduled" in data)) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : rawResponseText || "TikTok scheduling failed";
        console.error("[TikTokSchedule] Request failed", {
          status: response.status,
          statusText: response.statusText,
          body: rawResponseText,
        });
        setError(message);
        toast.error(message);
        throw new Error(message);
      }

      setResult(data);
      toast.success("TikTok post was scheduled successfully");
      return data;
    } catch (err) {
      console.error("[TikTokSchedule] Unexpected error", err, { payload });
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast.error(message);
      throw err instanceof Error ? err : new Error(message);
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
