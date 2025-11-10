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
import { DummyPost, PostSkeletonGrid } from "@/components/ui/post-skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const TEMPLATES_PER_PAGE = 56;
const TEMPLATE_GRID_CLASSNAMES =
  "grid grid-cols-1 gap-4 content-start sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 3xl:grid-cols-10 pb-4";

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
  const [templateCommunityPosts, setTemplateCommunityPosts] = useState<
    TemplatePost[]
  >([]);
  const [templatePersonalPosts, setTemplatePersonalPosts] = useState<
    TemplatePost[]
  >([]);
  const [communityPage, setCommunityPage] = useState(1);
  const [communityTotalPosts, setCommunityTotalPosts] = useState(0);
  const [communityLoadingState, setCommunityLoadingState] = useState<
    "idle" | "initial" | "page-change"
  >("idle");
  const [isPersonalLoading, setIsPersonalLoading] = useState(false);
  const [templateTab, setTemplateTab] = useState<"community" | "mine">(
    "community",
  );
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [generatingPromptForId, setGeneratingPromptForId] = useState<
    string | null
  >(null);
  const [sortBy, setSortBy] = useState<
    "views-most" | "views-least" | "likes-most" | "likes-least"
  >("likes-most");
  const compactFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [],
  );
  const formatCount = (value: number) => compactFormatter.format(value);
  const hasLoadedCommunityRef = useRef(false);
  const hasLoadedPersonalRef = useRef(false);
  const scrollTemplateModalToTop = useCallback(() => {
    requestAnimationFrame(() => {
      if (templateModalBodyRef.current) {
        templateModalBodyRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });
      }

      const viewport =
        templateTab === "community"
          ? communityViewportRef.current
          : personalViewportRef.current;

      if (viewport) {
        viewport.scrollTop = 0;
        viewport.scrollLeft = 0;
      }
    });
  }, [templateTab]);

  useEffect(() => {
    setCurrentPresentation("", "");
    // Make sure to reset any generation flags when landing on dashboard
    setIsGeneratingOutline(false);
    setShouldStartOutlineGeneration(false);
  }, []);

  useEffect(() => {
    if (showTemplates) {
      setTemplateTab("community");
      setCommunityPage(1);
      return;
    }

    hasLoadedCommunityRef.current = false;
    hasLoadedPersonalRef.current = false;
    setCommunityLoadingState("idle");
    setIsPersonalLoading(false);
    setTemplateError(null);
  }, [showTemplates]);

  useEffect(() => {
    if (!showTemplates) {
      return;
    }

    let isCancelled = false;

    const fetchCommunityPosts = async () => {
      try {
        setTemplateError(null);
        setCommunityLoadingState(
          hasLoadedCommunityRef.current ? "page-change" : "initial",
        );

        const params = new URLSearchParams({
          limit: TEMPLATES_PER_PAGE.toString(),
          offset: Math.max(
            0,
            (communityPage - 1) * TEMPLATES_PER_PAGE,
          ).toString(),
        });

        const response = await fetch(
          `/api/slideshow-library/posts?${params.toString()}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Prompts konnten nicht geladen werden");
        }

        const communityData = (await response.json()) as TemplateApiResponse;
        if (isCancelled) return;

        const normalized = normalizeTemplatePosts(communityData);
        setTemplateCommunityPosts(normalized);
        setCommunityTotalPosts(
          extractTemplateTotalCount(communityData, normalized.length),
        );
        hasLoadedCommunityRef.current = true;
      } catch (error) {
        if (isCancelled) return;
        console.error("Error fetching community templates:", error);
        setTemplateError(
          error instanceof Error
            ? error.message
            : "Prompts konnten nicht geladen werden",
        );
      } finally {
        if (isCancelled) return;
        setCommunityLoadingState("idle");
      }
    };

    void fetchCommunityPosts();

    return () => {
      isCancelled = true;
    };
  }, [showTemplates, communityPage]);

  useEffect(() => {
    if (!showTemplates || hasLoadedPersonalRef.current) {
      return;
    }

    let isCancelled = false;

    const fetchPersonalPosts = async () => {
      try {
        setIsPersonalLoading(true);
        const personalRes = await fetch(
          "/api/slideshow-library/user/posts?limit=120",
          { cache: "no-store" },
        );

        if (!personalRes.ok) {
          if (personalRes.status === 401) {
            if (!isCancelled) {
              setTemplatePersonalPosts([]);
              hasLoadedPersonalRef.current = true;
            }
            return;
          }

          const errorText = await personalRes
            .json()
            .catch(() => ({}) as { error?: string });
          console.warn("Failed to load personal posts", errorText);
          throw new Error("Prompts konnten nicht geladen werden");
        }

        const personalData = (await personalRes.json()) as TemplateApiResponse;
        if (isCancelled) return;

        setTemplatePersonalPosts(normalizeTemplatePosts(personalData));
        hasLoadedPersonalRef.current = true;
      } catch (error) {
        if (isCancelled) return;
        console.error("Error fetching personal templates:", error);
        setTemplateError(
          error instanceof Error
            ? error.message
            : "Prompts konnten nicht geladen werden",
        );
      } finally {
        if (isCancelled) return;
        setIsPersonalLoading(false);
      }
    };

    void fetchPersonalPosts();

    return () => {
      isCancelled = true;
    };
  }, [showTemplates]);
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
  const templateModalBodyRef = useRef<HTMLDivElement | null>(null);

  const sortedCommunityPosts = useMemo(
    () => sortPosts(templateCommunityPosts),
    [sortPosts, templateCommunityPosts],
  );
  const sortedPersonalPosts = useMemo(
    () => sortPosts(templatePersonalPosts),
    [sortPosts, templatePersonalPosts],
  );
  const communityPostsWithDummies = useMemo(
    () =>
      withDummyTemplates(
        sortedCommunityPosts,
        TEMPLATES_PER_PAGE,
        `community-${communityPage}`,
      ),
    [sortedCommunityPosts, communityPage],
  );
  const personalPostsWithDummies = useMemo(
    () => withDummyTemplates(sortedPersonalPosts, TEMPLATES_PER_PAGE, "mine"),
    [sortedPersonalPosts],
  );
  const communityTotalPages = useMemo(() => {
    const totalCount =
      communityTotalPosts > 0
        ? communityTotalPosts
        : sortedCommunityPosts.length;
    const pages = Math.ceil(totalCount / TEMPLATES_PER_PAGE);
    return Math.max(1, pages || 1);
  }, [communityTotalPosts, sortedCommunityPosts.length]);

  const handleCommunityPageChange = (page: number) => {
    if (
      page < 1 ||
      page > communityTotalPages ||
      page === communityPage ||
      communityLoadingState !== "idle"
    ) {
      return;
    }
    scrollTemplateModalToTop();
    setCommunityPage(page);
  };

  useEffect(() => {
    if (!showTemplates) return;
    scrollTemplateModalToTop();
  }, [
    showTemplates,
    templateTab,
    sortedCommunityPosts,
    sortedPersonalPosts,
    scrollTemplateModalToTop,
  ]);

  const renderTemplateGrid = (
    posts: TemplateGridItem[],
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
        className="h-full max-h-full pr-0 overscroll-contain scrollbar-hide"
      >
        <div className={TEMPLATE_GRID_CLASSNAMES}>
          {posts.map((post) => {
            if ("isDummy" in post && post.isDummy) {
              return (
                <div key={post.id} className="flex flex-col gap-2">
                  <DummyPost aspectClassName="aspect-[3/4]" />
                  <div className="h-10 w-full rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20" />
                </div>
              );
            }

            const primarySlide = isTemplatePost(post)
              ? (post.slides?.find((slide) => slide.imageUrl)?.imageUrl ?? null)
              : (post.slides?.find((slide) => slide.imageUrl)?.imageUrl ??
                null);
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
                            {formatCount(
                              isTemplatePost(post)
                                ? post.viewCount
                                : (post.viewCount ?? 0),
                            )}{" "}
                            Views
                          </span>
                          <span className="flex items-center gap-1">
                            <HeartIcon className="h-3.5 w-3.5" />
                            {formatCount(
                              isTemplatePost(post)
                                ? post.likeCount
                                : (post.likeCount ?? 0),
                            )}{" "}
                            Likes
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
                  onClick={() =>
                    handleGeneratePrompt(
                      post.id,
                      isTemplatePost(post) ? post.slides : (post.slides ?? []),
                    )
                  }
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
        <DialogContent className="!max-w-none w-[98vw] h-[95vh] max-h-[95vh] p-0 overflow-hidden flex flex-col m-auto rounded-xl shadow-xl border border-border/20">
          <div
            ref={templateModalBodyRef}
            className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overscroll-contain scrollbar-hide"
          >
            <Tabs
              value={templateTab}
              onValueChange={(value) =>
                setTemplateTab(value as "community" | "mine")
              }
              className="flex flex-col min-h-0"
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
                    <DropdownMenuItem onClick={() => setSortBy("likes-most")}>
                      Likes (Most)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("likes-least")}>
                      Likes (Least)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("views-most")}>
                      Views (Most)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("views-least")}>
                      Views (Least)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {templateError ? (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  {templateError}
                </div>
              ) : (
                <>
                  <TabsContent value="community" className="mt-4 min-h-0">
                    {communityLoadingState !== "idle" ? (
                      <PostSkeletonGrid
                        gridClassName={TEMPLATE_GRID_CLASSNAMES}
                        aspectClassName="aspect-[3/4]"
                        count={TEMPLATES_PER_PAGE}
                        showButton
                      />
                    ) : sortedCommunityPosts.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                        Keine Community-Posts vorhanden.
                      </div>
                    ) : (
                      <>
                        {renderTemplateGrid(
                          communityPostsWithDummies,
                          "Keine Community-Posts vorhanden.",
                          "community",
                        )}
                        {communityTotalPages > 1 && (
                          <SimplePagination
                            currentPage={communityPage}
                            totalPages={communityTotalPages}
                            onPageChange={handleCommunityPageChange}
                            className="mt-6"
                          />
                        )}
                      </>
                    )}
                  </TabsContent>
                  <TabsContent value="mine" className="mt-4 min-h-0">
                    {isPersonalLoading ? (
                      <PostSkeletonGrid
                        gridClassName={TEMPLATE_GRID_CLASSNAMES}
                        aspectClassName="aspect-[3/4]"
                        count={TEMPLATES_PER_PAGE}
                      />
                    ) : sortedPersonalPosts.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                        Du hast noch keine Posts gespeichert.
                      </div>
                    ) : (
                      renderTemplateGrid(
                        personalPostsWithDummies,
                        "Du hast noch keine Posts gespeichert.",
                        "mine",
                      )
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type TemplateApiResponse =
  | TemplatePost[]
  | {
      posts?: TemplatePost[];
      totalCount?: number;
    };

type DummyTemplatePost = {
  id: string;
  isDummy: true;
  slides?: Array<{
    id: string;
    imageUrl: string;
    slideIndex?: number;
  }>;
  viewCount?: number;
  likeCount?: number;
};

type TemplateGridItem = TemplatePost | DummyTemplatePost;

function isTemplatePost(post: TemplateGridItem): post is TemplatePost {
  return !("isDummy" in post && post.isDummy);
}

function normalizeTemplatePosts(
  data: TemplateApiResponse | null,
): TemplatePost[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.posts)) {
    return data.posts;
  }

  return [];
}

function extractTemplateTotalCount(
  data: TemplateApiResponse | null,
  fallbackLength: number,
): number {
  if (!data) {
    return fallbackLength;
  }

  if (Array.isArray(data)) {
    return data.length || fallbackLength;
  }

  if (typeof data.totalCount === "number") {
    return data.totalCount;
  }

  if (Array.isArray(data.posts)) {
    return data.posts.length;
  }

  return fallbackLength;
}

function withDummyTemplates(
  posts: TemplatePost[],
  minimumCount: number,
  seed: string,
): TemplateGridItem[] {
  if (posts.length === 0) {
    return [];
  }

  if (posts.length >= minimumCount) {
    return posts;
  }

  const dummyCount = minimumCount - posts.length;
  const dummies: DummyTemplatePost[] = Array.from(
    { length: dummyCount },
    (_, index) => ({
      id: `${seed}-dummy-${index}`,
      isDummy: true,
    }),
  );

  return [...posts, ...dummies];
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
