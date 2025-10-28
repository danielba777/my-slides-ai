"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
const DEFAULT_STYLE_ID = "1cb4b936-77bf-4f9a-9039-f3d349a4cdbe";

type ThemeOption = {
  name: string;
  imagePaths: string[];
  prompt: string;
  styleId: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    name: "Baby Doll Makeup",
    prompt: "Baby Doll Makeup aesthetic portrait",
    styleId: "b7c621b5-9d3c-46a3-8efb-4cdfbc592271",
    imagePaths: [
      "/ai-avatar-themes/baby_doll_makeup_01.png",
      "/ai-avatar-themes/baby_doll_makeup_02.png",
      "/ai-avatar-themes/baby_doll_makeup_03.png",
    ],
  },
  {
    name: "0.5 Selfie",
    prompt: "0.5 selfie captured on wide angle lens",
    styleId: "8dd89de9-1cff-402e-88a8-580c29d91473",
    imagePaths: [
      "/ai-avatar-themes/05_selfie_01.png",
      "/ai-avatar-themes/05_selfie_02.png",
      "/ai-avatar-themes/05_selfie_03.png",
    ],
  },
  {
    name: "0.5 Outfit",
    prompt: "0.5 outfit fashion streetwear showcase",
    styleId: "71fecd8c-6696-42df-b5eb-f69e4150ca01",
    imagePaths: [
      "/ai-avatar-themes/05_outfit_01.png",
      "/ai-avatar-themes/05_outfit_02.png",
      "/ai-avatar-themes/05_outfit_03.png",
    ],
  },
  {
    name: "Sitting on the Street",
    prompt: "portrait sitting on the street urban candid",
    styleId: "7696fd45-6e67-47d7-b800-096ce21cd449",
    imagePaths: [
      "/ai-avatar-themes/sitting_on_street_01.png",
      "/ai-avatar-themes/sitting_on_street_02.png",
      "/ai-avatar-themes/sitting_on_street_03.png",
    ],
  },
  {
    name: "Amalfi Summer",
    prompt: "Amalfi summer holiday sunlight portrait",
    styleId: "dab472a6-23f4-4cf8-98fe-f3e256f1b549",
    imagePaths: [
      "/ai-avatar-themes/amalfi_summer_01.png",
      "/ai-avatar-themes/amalfi_summer_02.png",
      "/ai-avatar-themes/amalfi_summer_03.png",
    ],
  },
  {
    name: "Self Care",
    prompt: "self care cozy indoor portrait",
    styleId: "d24c016c-9fb1-47d0-9909-19f57a2830d4",
    imagePaths: [
      "/ai-avatar-themes/self_care_01.png",
      "/ai-avatar-themes/self_care_02.png",
      "/ai-avatar-themes/self_care_03.png",
    ],
  },
  {
    name: "Elevator Mirror",
    prompt: "elevator mirror selfie chic outfit",
    styleId: "524be50a-4388-4ff5-a843-a73d2dd7ef87",
    imagePaths: [
      "/ai-avatar-themes/elevator_mirror_01.png",
      "/ai-avatar-themes/elevator_mirror_02.png",
      "/ai-avatar-themes/elevator_mirror_03.png",
    ],
  },
  {
    name: "Rainy Day",
    prompt: "rainy day moody portrait",
    styleId: "53bdadfa-8eb6-4eaa-8923-ebece4faa91c",
    imagePaths: [
      "/ai-avatar-themes/rainy_day_01.png",
      "/ai-avatar-themes/rainy_day_02.png",
      "/ai-avatar-themes/rainy_day_03.png",
    ],
  },
];

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
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [selectedThemeName, setSelectedThemeName] = useState<string | null>(
    null,
  );

  const [limits, setLimits] = useState<{
    aiLeft: number;
    unlimited: boolean;
  } | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);

  const fetchUsageLimits = useCallback(async () => {
    try {
      setLimitsLoading(true);
      const response = await fetch("/api/billing/limits", {
        cache: "no-store",
      });
      if (!response.ok) {
        return;
      }
      const data = await response.json().catch(() => null);
      if (!data) {
        return;
      }
      setLimits({
        aiLeft: typeof data.aiLeft === "number" ? data.aiLeft : 0,
        unlimited: Boolean(data.unlimited),
      });
    } catch (error) {
      console.error("Failed to fetch usage limits", error);
    } finally {
      setLimitsLoading(false);
    }
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

  useEffect(() => {
    void loadTemplates();
    void loadRecentCreations();
    void fetchPendingJobs();
  }, [loadTemplates, loadRecentCreations, fetchPendingJobs]);

  useEffect(() => {
    void fetchUsageLimits();
  }, [fetchUsageLimits]);

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

    if (
      limits &&
      !limits.unlimited &&
      typeof limits.aiLeft === "number" &&
      limits.aiLeft < 2
    ) {
      toast.error("Not enough AI credits");
      window.location.href = "/#pricing";
      return;
    }

    setIsThemeMenuOpen(false);
    const startedAt = Date.now();
    const styleIdToUse = selectedStyleId ?? DEFAULT_STYLE_ID;
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

    try {
      const response = await fetch("/api/ai-avatars/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedPrompt, styleId: styleIdToUse }),
      });
      const data = (await response.json().catch(() => null)) as {
        job?: GenerationJob;
        error?: string;
      } | null;

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

      const jobPlaceholders = Array.from(
        { length: expectedImages },
        (_, index) => ({
          id: `${data.job!.id}-${index}`,
          startedAt: jobStartedAt,
        }),
      );

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
      void fetchUsageLimits();
    } catch (error) {
      console.error("Generation failed to start", error);
      setPendingGenerations((prev) =>
        prev.filter((item) => !item.id.startsWith(`${tempPrefix}-`)),
      );
      toast.error(
        error instanceof Error ? error.message : "Generation fehlgeschlagen",
      );
    } finally {
      setIsGenerating(false);
    }
  };

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
    if (previousPendingCount.current > 0 && pendingGenerations.length === 0) {
      void loadRecentCreations();
    }
    previousPendingCount.current = pendingGenerations.length;
  }, [pendingGenerations.length, loadRecentCreations]);

  return (
    <div className="notebook-section relative h-full w-full">
      <div className="space-y-10 py-12">
        <div className="mx-auto w-full max-w-5xl space-y-6 px-6">
          <AiAvatarPromptInput
            value={prompt}
            onChange={setPrompt}
            onGenerate={handleGenerate}
            onToggleThemes={() => setIsThemeMenuOpen((previous) => !previous)}
            hasSelectedTheme={Boolean(selectedStyleId)}
            selectedThemeImages={(() => {
              if (selectedThemeName) {
                const theme = THEME_OPTIONS.find(
                  (item) => item.name === selectedThemeName,
                );
                if (theme) {
                  return theme.imagePaths.slice(0, 3);
                }
              }
              return THEME_OPTIONS.slice(0, 3).map(
                (theme, index) =>
                  theme.imagePaths[index % theme.imagePaths.length] ??
                  theme.imagePaths[0] ??
                  "/ai-avatar-themes/baby_doll_makeup_01.png",
              );
            })()}
            isGenerating={isGenerating}
          />
          {(limitsLoading || limits) && (
            <div className="flex justify-end text-xs text-muted-foreground">
              {limitsLoading
                ? "Checking AI credits…"
                : limits?.unlimited
                  ? "Usage: unlimited"
                  : `Usage: ${limits?.aiLeft ?? 0} AI credits left`}
            </div>
          )}
        </div>

        {isThemeMenuOpen && (
          <div className="px-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {THEME_OPTIONS.map((theme) => {
                const isActive = selectedThemeName === theme.name;
                return (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setSelectedStyleId(null);
                        setSelectedThemeName(null);
                        setIsThemeMenuOpen(false);
                        toast.success("Standard-Theme aktiviert");
                        return;
                      }
                      setSelectedStyleId(theme.styleId);
                      setSelectedThemeName(theme.name);
                      setIsThemeMenuOpen(false);
                      toast.success(`${theme.name} Theme ausgewählt`);
                    }}
                    className={`group flex h-full flex-col rounded-2xl border border-2 bg-white/70 p-4 text-left transition hover:-translate-y-1 hover:border-foreground/30 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      isActive
                        ? "border-blue-500 shadow-lg"
                        : "border-muted shadow-sm"
                    }`}
                  >
                    <div className="text-sm font-semibold text-foreground">
                      {theme.name}
                    </div>
                    <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-lg">
                      {theme.imagePaths.map((path) => (
                        <div
                          key={path}
                          className="aspect-[2/3] overflow-hidden"
                        >
                          <img
                            src={path}
                            alt={`${theme.name} preview`}
                            className="h-full w-full object-cover transition group-hover:opacity-95"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
}
