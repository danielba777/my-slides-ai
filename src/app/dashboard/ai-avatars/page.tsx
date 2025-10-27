"use client";

import { Sparkles, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AiAvatarPromptInput } from "@/components/dashboard/ai-avatars/PromptInput";
import { AiAvatarTemplateGrid } from "@/components/dashboard/ai-avatars/TemplateGrid";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AiAvatarTemplate } from "@/types/ai-avatars";

export default function AiAvatarDashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [templates, setTemplates] = useState<AiAvatarTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [recentCreations, setRecentCreations] = useState<AiAvatarTemplate[]>(
    [],
  );
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const loadTemplates = async () => {
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
  };

  const loadRecentCreations = async () => {
    try {
      setIsLoadingRecent(true);
      // Placeholder: Hook up to user-generated avatars once API is ready.
      setRecentCreations([]);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleCopyPrompt = (value: string) => {
    setPrompt(value);
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success("Prompt kopiert"))
      .catch(() => toast.error("Prompt konnte nicht kopiert werden"));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Bitte gib einen Prompt ein");
      return;
    }
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

      const creations: AiAvatarTemplate[] = data.images.map(
        (image: { minUrl?: string; rawUrl?: string }, index: number) => ({
          id: `${data.id ?? "generated"}-${Date.now()}-${index}`,
          prompt: prompt.trim(),
          imageUrl: image?.minUrl ?? image?.rawUrl ?? "",
          rawImageUrl: image?.rawUrl,
          createdAt: new Date().toISOString(),
        }),
      );

      setRecentCreations((prev) =>
        [...creations, ...prev].slice(0, 18),
      );
      setActiveTab("recent");
      toast.success("Avatar generiert");
    } catch (error) {
      console.error("Generation failed", error);
      toast.error(
        error instanceof Error ? error.message : "Generation fehlgeschlagen",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const templatesCountLabel = useMemo(
    () => `${templates.length} Template${templates.length === 1 ? "" : "s"}`,
    [templates.length],
  );

  return (
    <div className="notebook-section relative h-full w-full">
      <div className="space-y-10 py-12">
        <div className="mx-auto w-full max-w-5xl space-y-6 px-6">
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

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "recent" | "templates")
          }
          className="space-y-4 px-6"
        >
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/70 p-1">
            <TabsTrigger
              value="recent"
              className="rounded-xl text-sm data-[state=active]:bg-background"
            >
              Recently created
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="rounded-xl text-sm data-[state=active]:bg-background"
            >
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-0">
            {isLoadingRecent ? (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <AiAvatarTemplateGrid
                templates={recentCreations}
                onCopy={handleCopyPrompt}
              />
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Templates</h2>
              <span className="text-sm text-muted-foreground">
                {templatesCountLabel}
              </span>
            </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
