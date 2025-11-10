"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useTikTokAccounts } from "./use-tiktok-accounts";
import { DEFAULT_TIKTOK_POST_MODE } from "@/lib/tiktok-post-mode";

export interface TikTokDirectPostPayload {
  caption: string;
  title: string;
  coverIndex: number;
  autoAddMusic?: boolean;
  postMode?: "MEDIA_UPLOAD" | "DIRECT_POST";
  photoImages: string[];
  openId: string;
  privacyLevel?: string;
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
  isCommercialContent?: boolean;
  brandOption?: "YOUR_BRAND" | "BRANDED_CONTENT" | "BOTH" | null;
}

export interface TikTokDirectPostResult {
  publishId: string;
  status: "processing" | "success" | "failed" | "inbox";
  postId?: string;
  releaseUrl?: string;
  error?: string;
}

interface UseTikTokDirectPostOptions {
  defaultValues?: Partial<TikTokDirectPostPayload>;
}

export interface UseTikTokDirectPostResult {
  form: TikTokDirectPostPayload;
  setForm: React.Dispatch<React.SetStateAction<TikTokDirectPostPayload>>;
  updateField: <K extends keyof TikTokDirectPostPayload>(
    key: K,
    value: TikTokDirectPostPayload[K]
  ) => void;
  submitting: boolean;
  result: TikTokDirectPostResult | null;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  handleSubmit: () => Promise<TikTokDirectPostResult | null>;
  reset: (values?: Partial<TikTokDirectPostPayload>) => void;
  // For compatibility with TikTokPostForm
  accounts: ReturnType<typeof useTikTokAccounts>["accounts"];
  accountsLoading: ReturnType<typeof useTikTokAccounts>["loading"];
  refreshAccounts: ReturnType<typeof useTikTokAccounts>["refresh"];
}

const DEFAULT_VALUES: TikTokDirectPostPayload = {
  openId: "",
  caption: "",
  title: "",
  coverIndex: 0,
  photoImages: [],
  autoAddMusic: true,
  postMode: DEFAULT_TIKTOK_POST_MODE,
};

export function useTikTokDirectPost(
  options: UseTikTokDirectPostOptions = {},
): UseTikTokDirectPostResult {
  const initialForm = { ...DEFAULT_VALUES, ...options.defaultValues };
  const [form, setForm] = useState<TikTokDirectPostPayload>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TikTokDirectPostResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get accounts from separate hook for compatibility
  const { accounts, loading: accountsLoading, refresh: refreshAccounts } = useTikTokAccounts();

  const updateField = useCallback(
    <K extends keyof TikTokDirectPostPayload>(
      key: K,
      value: TikTokDirectPostPayload[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setError(null);
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    // Validate required fields
    if (!form.openId.trim()) {
      setError("Please select a TikTok account");
      return null;
    }

    if (!form.caption.trim()) {
      setError("Please enter a caption");
      return null;
    }

    if (!form.photoImages || form.photoImages.length === 0) {
      setError("Please add at least one image");
      return null;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/tiktok/create-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { error?: string }));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = (await response.json()) as TikTokDirectPostResult;
      setResult(data);

      // Show info toast for processing status - UI will handle the rest
      if (data.status === "inbox") {
        toast.success("Post sent to TikTok inbox for review");
        toast("Please note: It may take a few minutes for your post to appear on TikTok");
      } else if (data.status === "success") {
        toast.success("Post published successfully to TikTok");
        toast("Please note: It may take a few minutes for your post to appear on TikTok");
      } else if (data.status === "processing") {
        toast("Post is being processed by TikTok...");
        toast("Please note: It may take a few minutes for your post to appear on TikTok");
      }

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to post to TikTok";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  const reset = useCallback(
    (values?: Partial<TikTokDirectPostPayload>) => {
      setForm({ ...initialForm, ...values });
      setResult(null);
      setError(null);
    },
    [initialForm],
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
