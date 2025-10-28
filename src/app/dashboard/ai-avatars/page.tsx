"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AiAvatarPromptInput } from "@/components/dashboard/ai-avatars/PromptInput";
import { AiAvatarTemplateGrid } from "@/components/dashboard/ai-avatars/TemplateGrid";
import { Spinner } from "@/components/ui/spinner";
import type { AiAvatarTemplate } from "@/types/ai-avatars";

type GenerationJob = {
  id: string;
  startedAt: string;
  expectedImages?: number;
};

const EXPECTED_GENERATION_BATCH_SIZE = 4;

export default function AiAvatarDashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [templates, setTemplates] = useState<AiAvatarTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [recentCreations, setRecentCreations] = useState<AiAvatarTemplate[]>(
    [],
  );
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingGenerations, setPendingGenerations] = useState<
    Array<{ id: string; startedAt: number }>
  >([]);
  const [activeTab, setActiveTab] = useState<"recent" | "templates">(
    "templates",
  );
  const [activeTab, setActiveTab] = useState<"recent" | "templates">("templates");

  const [limits, setLimits] = useState<{ aiLeft: number; unlimited: boolean } | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);

  useEffect(() => {
    void loadTemplates();
    void loadRecentCreations();

    void (async () => {
      try {
        setLimitsLoading(true);
        const res = await fetch("/api/billing/limits", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setLimits({ aiLeft: data?.aiLeft ?? 0, unlimited: !!data?.unlimited });
      } finally {
        setLimitsLoading(false);
      }
    })();
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoadingTemplates(true);
      const response = await fetch("/api/ai-avatars/templates");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Konnte Templates nicht laden");
      }
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading avatar templates:", error);
      toast.error("Templates konnten nicht geladen werden");
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  const loadRecentCreations = useCallback(async () => {
    try {
      setIsLoadingRecent(true);
      const response = await fetch("/api/ai-avatars/creations", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | AiAvatarTemplate[]
        | { error?: string }
        | null;

      if (!response.ok || !Array.isArray(data)) {
        throw new Error("Failed to load generated avatars");
      }

      setRecentCreations(data);
    } catch (error) {
      console.error("Error loading recent AI avatars:", error);
      setRecentCreations([]);
      toast.error("Erstellte Avatare konnten nicht geladen werden");
    } finally {
      setIsLoadingRecent(false);
    }
  }, []);

  const fetchPendingJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/ai-avatars/jobs", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | GenerationJob[]
        | { error?: string }
        | null;

      if (!response.ok || !Array.isArray(data)) {
        throw new Error("Failed to load generation jobs");
      }

      const placeholders: Array<{ id: string; startedAt: number }> = [];
      data.forEach((job) => {
        const startedAt = new Date(job.startedAt ?? Date.now()).getTime();
        const count = Math.max(
          job.expectedImages ?? EXPECTED_GENERATION_BATCH_SIZE,
          1,
        );
        for (let index = 0; index < count; index += 1) {
          placeholders.push({
            id: `${job.id}-${index}`,
            startedAt,
          });
        }
      });

      setPendingGenerations(placeholders);
      return data;
    } catch (error) {
      console.error("Error loading generation jobs:", error);
      return null;
    }
  }, []);

  const handleCopyPrompt = (value: string) => {
    setPrompt(value);
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success("Prompt kopiert"))
      .catch(() => toast.error("Prompt konnte nicht kopiert werden"));
  };

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      toast.error("Bitte gib einen Prompt ein");
      return;
    }

    const startedAt = Date.now();
    const tempPrefix = `pending-${startedAt}`;
    const tempPlaceholders = Array.from(
      { length: EXPECTED_GENERATION_BATCH_SIZE },
      (_, index) => ({
        id: `${tempPrefix}-${index}`,
        startedAt,
      }),
    );

    setPrompt("");
    setActiveTab("recent");
    setPendingGenerations((prev) => [...tempPlaceholders, ...prev]);
    setIsGenerating(true);
    void (async () => {
      try {
        const response = await fetch("/api/ai-avatars/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmedPrompt }),
        });
        const data = (await response.json().catch(() => null)) as
          | { job?: GenerationJob; error?: string }
          | null;

        if (!response.ok || !data?.job?.id) {
          throw new Error(
            (data?.error as string | undefined) ??
              "Generation konnte nicht gestartet werden",
          );
        }

        const jobStartedAt = new Date(data.job.startedAt ?? Date.now()).getTime();
        const expectedImages = Math.max(
          data.job.expectedImages ?? EXPECTED_GENERATION_BATCH_SIZE,
          1,
        );

        const jobPlaceholders = Array.from({ length: expectedImages }, (_, index) => ({
          id: `${data.job!.id}-${index}`,
          startedAt: jobStartedAt,
        }));

        setPendingGenerations((prev) => {
          const filtered = prev.filter(
            (item) => !item.id.startsWith(`${tempPrefix}-`),
          );
          const merged = [...jobPlaceholders, ...filtered];
          const unique = new Map<string, { id: string; startedAt: number }>();
          merged.forEach((item) => {
            if (!unique.has(item.id)) {
              unique.set(item.id, item);
            }
          });
          return Array.from(unique.values());
        });

        toast.info("Avatar-Generierung gestartet");
        void fetchPendingJobs();
      } catch (error) {
        console.error("Generation failed to start", error);
        setPendingGenerations((prev) =>
          prev.filter((item) => !item.id.startsWith(`${tempPrefix}-`)),
        );
        toast.error(
          error instanceof Error ? error.message : "Generation fehlgeschlagen",
        );
    const canGenerate = limits?.unlimited || (typeof limits?.aiLeft === "number" && limits.aiLeft >= 2);
    if (!canGenerate) {
      toast.error("Not enough AI credits");
      window.location.href = "/#pricing";
      return;
    }
       setIsGenerating(true);
    try {
      const response = await fetch("/api/ai-avatars/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data?.images) || data.images.length === 0) {
        throw new Error(data?.error || "Generation fehlgeschlagen");
      }
    })();
    setIsGenerating(false);
  };

  useEffect(() => {
    void loadTemplates();
    void loadRecentCreations();
    void fetchPendingJobs();
  }, [loadTemplates, loadRecentCreations, fetchPendingJobs]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchPendingJobs();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchPendingJobs]);

  const previousPendingCount = useRef(0);

  useEffect(() => {
    if (
      previousPendingCount.current > 0 &&
      pendingGenerations.length === 0
    ) {
      void loadRecentCreations();
    }
    previousPendingCount.current = pendingGenerations.length;
  }, [pendingGenerations.length, loadRecentCreations]);

  const templatesCountLabel = useMemo(
    () => `${templates.length} Template${templates.length === 1 ? "" : "s"}`,
    [templates.length],
  );

  return (
    <div className="notebook-section relative h-full w-full">
      <div className="space-y-10 py-12">
        <div className="mx-auto w-full max-w-5xl space-y-6 px-6">
          <AiAvatarPromptInput
            value={prompt}
            onChange={setPrompt}
            onShowTemplates={() => setActiveTab("templates")}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">AI Avatar Studio</h1>
              <p className="text-sm text-muted-foreground">
                Starte mit einem eigenen Prompt oder übernimm eine bestehende
                Vorlage.
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void loadTemplates()}
            >
              <Wand2 className="h-4 w-4" />
              Refresh templates
            </Button>
          </div>

        <AiAvatarPromptInput
          value={prompt}
          onChange={setPrompt}
          onShowTemplates={() => setActiveTab("templates")}
        />
        <div className="flex flex-col items-end gap-1">
            <Button
              className="gap-2"
              onClick={async () => {
                const canGenerate = limits?.unlimited || (typeof limits?.aiLeft === "number" && limits.aiLeft >= 2);
                if (canGenerate) {
                  await handleGenerate();
                } else {
                  window.location.href = "/#pricing";
                }
              }}
              disabled={isGenerating || !prompt.trim() || limitsLoading}
              variant={limits?.unlimited || (limits?.aiLeft ?? 0) >= 2 ? "default" : "secondary"}
            >
              {isGenerating ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {(limits?.unlimited || (limits?.aiLeft ?? 0) >= 2) ? "Generate" : "Upgrade Now"}
                </>
              )}
            </Button>
            <div className="text-xs text-muted-foreground">
              {limits?.unlimited ? "Usage: unlimited" : `Usage: ${limits?.aiLeft ?? 0} AI credits left`}
            </div>
          </div>
        </div>

        {/* Simple text toggle instead of Tabbar */}
        <div className="px-6">
          <div className="flex items-center gap-4 text-xl font-semibold text-zinc-500">
            <button
              type="button"
              onClick={() => setActiveTab("recent")}
              className={
                `transition-colors hover:text-foreground` +
                (activeTab === "recent"
                  ? "font-medium text-foreground"
                  : "text-muted-foreground")
              }
              aria-current={activeTab === "recent" ? "page" : undefined}
            >
              Recently created
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={
                `transition-colors hover:text-foreground` +
                (activeTab === "templates"
                  ? "font-medium text-foreground"
                  : "text-muted-foreground")
              }
              aria-current={activeTab === "templates" ? "page" : undefined}
            >
              Templates
            </button>
          </div>
        </div>

        {/* Content sections */}
        <div className="px-6">
          {activeTab === "recent" && (
            <div className="mt-4">
              {isLoadingRecent &&
              recentCreations.length === 0 &&
              pendingGenerations.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (
                <AiAvatarTemplateGrid
                  templates={recentCreations}
                  showOpenInNewTab
                  loadingPlaceholders={pendingGenerations}
                />
              )}
            </div>
          )}

          {activeTab === "templates" && (
            <div className="mt-4">
              {isLoadingTemplates ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (
                <AiAvatarTemplateGrid
                  templates={templates}
                  onCopy={handleCopyPrompt}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
