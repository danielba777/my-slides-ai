"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AiAvatarPromptInput } from "@/components/dashboard/ai-avatars/PromptInput";
import { AiAvatarTemplateGrid } from "@/components/dashboard/ai-avatars/TemplateGrid";
import { Spinner } from "@/components/ui/spinner";
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
  const [activeTab, setActiveTab] = useState<"recent" | "templates">(
    "templates",
  );

  useEffect(() => {
    void loadTemplates();
    void loadRecentCreations();
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

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai-avatars/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json().catch(() => ({}));
      if (
        !response.ok ||
        !Array.isArray(data?.images) ||
        data.images.length === 0
      ) {
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

      setRecentCreations((prev) => [...creations, ...prev].slice(0, 18));
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
          <AiAvatarPromptInput
            value={prompt}
            onChange={setPrompt}
            onShowTemplates={() => setActiveTab("templates")}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
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
