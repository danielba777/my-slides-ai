"use client";

import { createEmptyPresentation } from "@/app/_actions/presentation/presentationActions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePresentationState } from "@/states/presentation-state";
import {
  ArrowUpDown,
  HeartIcon,
  PlayIcon,
  PlusIcon,
  Wand2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageCollectionSelector } from "./ImageCollectionSelector";
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

  const [limits, setLimits] = useState<{
    slidesLeft: number;
    unlimited: boolean;
  } | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLimitsLoading(true);
        const res = await fetch("/api/billing/limits", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setLimits({
          slidesLeft: data?.slidesLeft ?? 0,
          unlimited: !!data?.unlimited,
        });
      } finally {
        setLimitsLoading(false);
      }
    };
    void load();
  }, []);
  const [templateCommunityPosts, setTemplateCommunityPosts] =
    useState<TemplatePost[]>([]);
  const [templatePersonalPosts, setTemplatePersonalPosts] = useState<
    TemplatePost[]
  >([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [templateTab, setTemplateTab] = useState<"community" | "mine">(
    "community",
  );
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [generatingPromptForId, setGeneratingPromptForId] = useState<
    string | null
  >(null);
  const [sortBy, setSortBy] = useState<
    "views-most" | "views-least" | "likes-most" | "likes-least"
  >("views-most");
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
    if (showTemplates) {
      setTemplateTab("community");
    }
  }, [showTemplates]);

  useEffect(() => {
    if (!showTemplates || templatesLoaded || isLoadingTemplates) {
      return;
    }

    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        setTemplateError(null);
        const [communityRes, personalRes] = await Promise.all([
          fetch("/api/slideshow-library/posts?limit=60"),
          fetch("/api/slideshow-library/user/posts?limit=120"),
        ]);

        if (!communityRes.ok) {
          throw new Error("Prompts konnten nicht geladen werden");
        }

        const communityData = (await communityRes.json()) as TemplatePost[];
        setTemplateCommunityPosts(
          Array.isArray(communityData) ? communityData : [],
        );

        if (personalRes.ok) {
          const personalData = (await personalRes.json()) as TemplatePost[];
          setTemplatePersonalPosts(
            Array.isArray(personalData) ? personalData : [],
          );
        } else if (personalRes.status === 401) {
          setTemplatePersonalPosts([]);
        } else {
          const errorText = await personalRes
            .json()
            .catch(() => ({} as { error?: string }));
          console.warn("Failed to load personal posts", errorText);
          setTemplatePersonalPosts([]);
        }
        setTemplatesLoaded(true);
      } catch (error) {
        console.error("Error fetching templates:", error);
        setTemplateError(
          error instanceof Error
            ? error.message
            : "Prompts konnten nicht geladen werden",
        );
        setTemplatesLoaded(false);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    void fetchTemplates();
  }, [showTemplates, templatesLoaded, isLoadingTemplates]);
  const canGenerate =
    limits?.unlimited ||
    (typeof limits?.slidesLeft === "number" && limits.slidesLeft > 0);

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

  const handleGeneratePrompt = async (
    postId: string,
    slides: TemplatePost["slides"],
  ) => {
    setGeneratingPromptForId(postId);
    try {
      const response = await fetch("/api/slideshow-library/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, slides }),
      });

      if (!response.ok) {
        throw new Error("Prompt konnte nicht generiert werden");
      }

      const { prompt } = (await response.json()) as { prompt: string };

      // Update the post in the state with the new prompt
      setTemplateCommunityPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, prompt } : post)),
      );
      setTemplatePersonalPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, prompt } : post)),
      );

      // Copy to input
      setPresentationInput(prompt);
      setShowTemplates(false);
      toast.success("Prompt wurde generiert und übernommen");
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Prompt konnte nicht generiert werden",
      );
    } finally {
      setGeneratingPromptForId(null);
    }
  };

  const sortPosts = useCallback(
    (posts: TemplatePost[]) => {
      const list = [...posts];
      switch (sortBy) {
        case "views-most":
          return list.sort((a, b) => b.viewCount - a.viewCount);
        case "views-least":
          return list.sort((a, b) => a.viewCount - b.viewCount);
        case "likes-most":
          return list.sort((a, b) => b.likeCount - a.likeCount);
        case "likes-least":
          return list.sort((a, b) => a.likeCount - b.likeCount);
        default:
          return list;
      }
    },
    [sortBy],
  );

  const communityViewportRef = useRef<HTMLDivElement | null>(null);
  const personalViewportRef = useRef<HTMLDivElement | null>(null);

  const sortedCommunityPosts = useMemo(
    () => sortPosts(templateCommunityPosts),
    [sortPosts, templateCommunityPosts],
  );
  const sortedPersonalPosts = useMemo(
    () => sortPosts(templatePersonalPosts),
    [sortPosts, templatePersonalPosts],
  );

  useEffect(() => {
    if (!showTemplates) return;

    const viewport =
      templateTab === "community"
        ? communityViewportRef.current
        : personalViewportRef.current;

    if (!viewport) return;

    requestAnimationFrame(() => {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
    });
  }, [showTemplates, templateTab, sortedCommunityPosts, sortedPersonalPosts]);

  const renderTemplateSection = (
    posts: TemplatePost[],
    emptyMessage: string,
    section: "community" | "mine",
  ) => {
    if (posts.length === 0) {
      return (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <ScrollArea
        viewportRef={
          section === "community" ? communityViewportRef : personalViewportRef
        }
        className="flex-1 min-h-0 overflow-y-auto pr-4"
      >
        <div className="grid grid-cols-1 gap-4 content-start sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
          {posts.map((post) => {
            const primarySlide =
              post.slides?.find((slide) => slide.imageUrl)?.imageUrl ?? null;
            const isGenerating = generatingPromptForId === post.id;

            return (
              <div key={post.id} className="flex flex-col gap-2">
                <div className="group relative overflow-hidden rounded-xl border bg-muted/30 transition hover:border-primary hover:shadow-lg">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                    {primarySlide ? (
                      <img
                        src={primarySlide}
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
                            {formatCount(post.viewCount)} Views
                          </span>
                          <span className="flex items-center gap-1">
                            <HeartIcon className="h-3.5 w-3.5" />
                            {formatCount(post.likeCount)} Likes
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
                  onClick={() => handleGeneratePrompt(post.id, post.slides)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4" />
                      Get Prompt
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case "views-most":
        return "Views (Most)";
      case "views-least":
        return "Views (Least)";
      case "likes-most":
        return "Likes (Most)";
      case "likes-least":
        return "Likes (Least)";
      default:
        return "Sort";
    }
  };

  return (
    <div className="notebook-section relative h-full w-full">
      <div className="mx-auto max-w-4xl space-y-12 px-6 py-12">
        <div className="space-y-8">
          <PresentationInput handleGenerate={handleGenerate} />
          <ImageCollectionSelector />
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Button
                className="gap-2"
                onClick={() =>
                  canGenerate ? handleGenerate() : router.push("/#pricing")
                }
                disabled={
                  isGeneratingOutline ||
                  !presentationInput.trim() ||
                  limitsLoading
                }
                variant={canGenerate ? "default" : "secondary"}
              >
                <Wand2 className="h-4 w-4" />
                {canGenerate ? "Generate" : "Upgrade Now"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-h-[95vh] w-full h-full max-w-[95vw] pt-4 pb-0 px-0 sm:rounded-xl">
          <div className="flex h-[93vh] min-h-0 flex-col px-6 pb-6 pt-6 gap-6 overflow-hidden">
            <Tabs
              value={templateTab}
              onValueChange={(value) =>
                setTemplateTab(value as "community" | "mine")
              }
              className="flex flex-1 flex-col"
            >
              <div className="flex flex-col gap-4 pr-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                  <h2 className="text-2xl font-semibold">
                    SlidesCockpit TikTok Library
                  </h2>
                  <TabsList className="grid w-full grid-cols-2 rounded-lg bg-muted p-1 sm:w-[320px]">
                    <TabsTrigger
                      value="community"
                      className="w-full rounded-md text-sm text-muted-foreground transition data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      Community
                    </TabsTrigger>
                    <TabsTrigger
                      value="mine"
                      className="w-full rounded-md text-sm text-muted-foreground transition data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      My Post Collections
                    </TabsTrigger>
                  </TabsList>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      {getSortLabel()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy("views-most")}>
                      Views (Most)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("views-least")}>
                      Views (Least)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("likes-most")}>
                      Likes (Most)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("likes-least")}>
                      Likes (Least)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {isLoadingTemplates ? (
                <div className="flex flex-1 items-center justify-center">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : templateError ? (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  {templateError}
                </div>
              ) : (
                <>
                  {templateTab === "community" ? (
                    <div className="mt-4 flex flex-1 min-h-0 flex-col focus:outline-none">
                      {renderTemplateSection(
                        sortedCommunityPosts,
                        "Keine Community-Posts vorhanden.",
                        "community",
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-1 min-h-0 flex-col focus:outline-none">
                      {renderTemplateSection(
                        sortedPersonalPosts,
                        "Du hast noch keine Posts gespeichert.",
                        "mine",
                      )}
                    </div>
                  )}
                </>
              )}
            </Tabs>
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
