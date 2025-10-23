"use client";

import { createEmptyPresentation } from "@/app/_actions/presentation/presentationActions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { usePresentationState } from "@/states/presentation-state";
import { HeartIcon, PlayIcon, PlusIcon, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ImageCollectionSelector } from "./ImageCollectionSelector";
import { PresentationControls } from "./PresentationControls";
import { PresentationInput } from "./PresentationInput";

interface TemplatePost {
  id: string;
  prompt: string | null;
  likeCount: number;
  viewCount: number;
  slideCount: number;
  slides: Array<{
    id: string;
    imageUrl: string;
    slideIndex?: number;
  }>;
}

export function PresentationDashboard({
  sidebarSide,
}: {
  sidebarSide?: "left" | "right";
}) {
  const router = useRouter();
  const {
    presentationInput,
    isGeneratingOutline,
    setCurrentPresentation,
    setIsGeneratingOutline,
    language,
    theme,
    setShouldStartOutlineGeneration,
    showTemplates,
    setShowTemplates,
    setPresentationInput,
  } = usePresentationState();

  const [templatePosts, setTemplatePosts] = useState<TemplatePost[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const compactFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [],
  );
  const formatCount = (value: number) => compactFormatter.format(value);

  useEffect(() => {
    setCurrentPresentation("", "");
    // Make sure to reset any generation flags when landing on dashboard
    setIsGeneratingOutline(false);
    setShouldStartOutlineGeneration(false);
  }, []);

  useEffect(() => {
    if (!showTemplates || templatePosts.length > 0 || isLoadingTemplates) {
      return;
    }

    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        setTemplateError(null);
        const response = await fetch("/api/slideshow-library/posts?limit=60");
        if (!response.ok) {
          throw new Error("Prompts konnten nicht geladen werden");
        }
        const data = (await response.json()) as TemplatePost[];
        setTemplatePosts(
          Array.isArray(data)
            ? data.filter((post) => (post.prompt ?? "").trim().length > 0)
            : [],
        );
      } catch (error) {
        console.error("Error fetching templates:", error);
        setTemplateError(
          error instanceof Error
            ? error.message
            : "Prompts konnten nicht geladen werden",
        );
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    void fetchTemplates();
  }, [showTemplates, templatePosts.length, isLoadingTemplates]);

  const promptCards = useMemo(
    () =>
      templatePosts.map((post) => {
        const primarySlide =
          post.slides?.find((slide) => slide.imageUrl)?.imageUrl ?? null;
        return {
          id: post.id,
          prompt: post.prompt ?? "",
          likeCount: post.likeCount,
          viewCount: post.viewCount,
          imageUrl: primarySlide,
        };
      }),
    [templatePosts],
  );

  const handleGenerate = async () => {
    if (!presentationInput.trim()) {
      toast.error("Please enter an AI prompt for your presentation");
      return;
    }

    // Set UI loading state
    setIsGeneratingOutline(true);

    try {
      const result = await createEmptyPresentation(
        derivePresentationTitleFromPrompt(presentationInput),
        theme,
        language,
      );

      if (result.success && result.presentation) {
        // Setze Pending-Cookie, sodass die Zielseite sofort loslegt
        try {
          const domain =
            typeof window !== "undefined" &&
            window.location.hostname === "localhost"
              ? "localhost"
              : ".allweone.com";
          document.cookie =
            `presentation_generation_pending=true; path=/; SameSite=Lax;` +
            (domain !== "localhost" ? ` domain=${domain};` : "");
        } catch {}
        // Set the current presentation
        setCurrentPresentation(
          result.presentation.id,
          result.presentation.title,
        );
        router.push(`/dashboard/slideshows/generate/${result.presentation.id}`);
      } else {
        setIsGeneratingOutline(false);
        toast.error(result.message || "Failed to create presentation");
      }
    } catch (error) {
      setIsGeneratingOutline(false);
      console.error("Error creating presentation:", error);
      toast.error("Failed to create presentation");
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    setPresentationInput(prompt);
    setShowTemplates(false);
    toast.success("Prompt übernommen");
  };

  return (
    <div className="notebook-section relative h-full w-full">
      <div className="mx-auto max-w-4xl space-y-12 px-6 py-12">
        <div className="space-y-8">
          <PresentationInput handleGenerate={handleGenerate} />
          <ImageCollectionSelector />
          <div className="grid gap-4 items-end md:grid-cols-6">
            <PresentationControls className="md:col-span-5" />
            <Button
              onClick={handleGenerate}
              disabled={!presentationInput.trim() || isGeneratingOutline}
              variant={isGeneratingOutline ? "loading" : "default"}
              className="w-full gap-2 md:col-span-1 md:w-auto md:justify-center"
            >
              <Wand2 className="h-4 w-4" />
              Generate
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-h-[85vh] w-full max-w-6xl overflow-hidden p-0 sm:rounded-xl">
          <div className="flex h-[74vh] flex-col px-6 pb-6 pt-6 gap-6">
            <h2 className="text-2xl font-semibold">
              SlidesCockpit TikTok Library
            </h2>
            {isLoadingTemplates ? (
              <div className="flex flex-1 items-center justify-center">
                <Spinner text="Lade Prompts..." />
              </div>
            ) : templateError ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                {templateError}
              </div>
            ) : promptCards.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Keine Prompts vorhanden.
              </div>
            ) : (
              <ScrollArea className="flex-1 pr-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {promptCards.map((card) => (
                    <div key={card.id} className="flex flex-col gap-2">
                      <div className="group relative overflow-hidden rounded-xl border bg-muted/30 transition hover:border-primary hover:shadow-lg">
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                          {card.imageUrl ? (
                            <img
                              src={card.imageUrl}
                              alt="Slideshow preview"
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                              Keine Vorschau
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 p-3">
                            <div className="rounded-xl backdrop-blur-sm">
                              <div className="flex flex-col items-start gap-1 text-xs font-medium text-white">
                                <span className="flex items-center gap-1">
                                  <PlayIcon className="h-3.5 w-3.5" />
                                  {formatCount(card.viewCount)} Views
                                </span>
                                <span className="flex items-center gap-1">
                                  <HeartIcon className="h-3.5 w-3.5" />
                                  {formatCount(card.likeCount)} Likes
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2 border-2 border-zinc-900"
                        onClick={() => handleSelectPrompt(card.prompt)}
                      >
                        <PlusIcon className="h-4 w-4" />
                        Get Prompt
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function derivePresentationTitleFromPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return "Untitled Presentation";

  const aboutPattern = trimmed.match(
    /slides?\s+(?:about|on)\s+['\"]?([^'\"\n]+)['\"]?/i,
  );
  if (aboutPattern && aboutPattern[1]) {
    return (
      toTitleCase(aboutPattern[1].trim()).slice(0, 80) ||
      "Untitled Presentation"
    );
  }

  const firstLine = trimmed.split(/\r?\n/)[0] ?? trimmed;
  const firstSentence = firstLine.split(/(?<=[.!?])/)[0];
  const fallback = firstSentence || trimmed;
  return toTitleCase(fallback).slice(0, 80) || "Untitled Presentation";
}

function toTitleCase(input: string): string {
  return input.replace(/\w[\w']*/g, (word) => {
    const lower = word.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
}
