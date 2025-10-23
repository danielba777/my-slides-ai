"use client";

import { AppLogo } from "@/components/logo/AppLogo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  HeartIcon,
  Images,
  PlayIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface SlideshowPostSummary {
  id: string;
  accountId: string;
  caption?: string;
  prompt?: string | null;
  likeCount: number;
  viewCount: number;
  slides: Array<{
    id: string;
    imageUrl: string;
    slideIndex?: number;
    textContent?: string;
  }>;
  account?: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
    followerCount?: number;
    followingCount?: number;
  } | null;
}

interface SlideshowPostDetail extends SlideshowPostSummary {
  slides: Array<{
    id: string;
    slideIndex: number;
    imageUrl: string;
    textContent?: string;
  }>;
}

interface SlideshowAccountDetail {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  followerCount: number;
  followingCount: number;
  isVerified: boolean;
  isActive: boolean;
  _count?: { posts: number };
  posts?: Array<{
    id: string;
    likeCount: number;
    viewCount: number;
    prompt?: string | null;
    slides: Array<{
      id: string;
      imageUrl: string;
    }>;
  }>;
}

const compactNumberFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCount = (value: number) => compactNumberFormatter.format(value);
const normalizePrompt = (value: string | null | undefined) =>
  (value ?? "").trim();

export default function DashboardHome() {
  const [posts, setPosts] = useState<SlideshowPostSummary[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SlideshowPostDetail | null>(
    null,
  );
  const [selectedAccount, setSelectedAccount] =
    useState<SlideshowAccountDetail | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [modalError, setModalError] = useState<string | null>(null);
  const [postCache, setPostCache] = useState<
    Record<string, SlideshowPostDetail>
  >({});
  const [accountCache, setAccountCache] = useState<
    Record<string, SlideshowAccountDetail>
  >({});
  const [promptDraft, setPromptDraft] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoadingPosts(true);
        const response = await fetch("/api/slideshow-library/posts");
        if (!response.ok) {
          throw new Error("Failed to load slideshow posts");
        }
        const data = (await response.json()) as Array<SlideshowPostSummary>;
        const sanitized = Array.isArray(data)
          ? data.filter(
              (post) => Array.isArray(post.slides) && post.slides.length > 0,
            )
          : [];
        setPosts(sanitized);
      } catch (error) {
        console.error("Error loading slideshow posts:", error);
        setPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    void loadPosts();
  }, []);

  const postCards = useMemo(
    () =>
      posts.map((post) => ({
        id: post.id,
        likeCount: post.likeCount,
        viewCount: post.viewCount,
        imageUrl: post.slides?.[0]?.imageUrl ?? null,
      })),
    [posts],
  );

  useEffect(() => {
    if (selectedPost) {
      setPromptDraft(selectedPost.prompt ?? "");
    } else {
      setPromptDraft("");
    }
  }, [selectedPost?.id]);

  const promptHasChanged = selectedPost
    ? normalizePrompt(selectedPost.prompt) !== normalizePrompt(promptDraft)
    : false;

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    setSelectedAccount(null);
    setActiveSlideIndex(0);
    setModalError(null);
    setIsModalLoading(false);
    setPromptDraft("");
    setIsSavingPrompt(false);
  };

  const openPostModal = async (postId: string) => {
    if (postId === selectedPost?.id && isModalOpen) {
      return;
    }

    const cachedPost = postCache[postId];
    const cachedAccount =
      cachedPost && accountCache[cachedPost.accountId]
        ? accountCache[cachedPost.accountId]
        : null;

    let provisionalPost: SlideshowPostDetail | null = cachedPost ?? null;

    const accountPost =
      selectedAccount?.posts?.find((post) => post.id === postId) ?? null;

    if (!provisionalPost && accountPost && selectedAccount) {
      const normalizedSlides = (accountPost.slides ?? []).map(
        (slide, index) => ({
          id: slide.id,
          slideIndex: slide.slideIndex ?? index,
          imageUrl: slide.imageUrl,
          textContent: (slide as { textContent?: string }).textContent,
        }),
      );

      provisionalPost = {
        id: accountPost.id,
        accountId: selectedAccount.id,
        caption: (accountPost as { caption?: string }).caption,
        prompt: (accountPost as { prompt?: string | null }).prompt ?? null,
        likeCount: accountPost.likeCount,
        viewCount: accountPost.viewCount,
        slides: normalizedSlides,
        account: {
          id: selectedAccount.id,
          username: selectedAccount.username,
          displayName: selectedAccount.displayName,
          profileImageUrl: selectedAccount.profileImageUrl,
          followerCount: selectedAccount.followerCount,
          followingCount: selectedAccount.followingCount,
        },
      };

      setPostCache((prev) => ({
        ...prev,
        [provisionalPost!.id]: provisionalPost!,
      }));
    }

    if (!isModalOpen) {
      setIsModalOpen(true);
    }

    if (provisionalPost) {
      setSelectedPost(provisionalPost);
      setActiveSlideIndex(0);
      setPromptDraft(provisionalPost.prompt ?? "");
      if (cachedAccount) {
        setSelectedAccount(cachedAccount);
      }
    } else {
      setSelectedPost(null);
    }

    setIsModalLoading(!provisionalPost);
    setModalError(null);

    try {
      const postResponse = await fetch(
        `/api/slideshow-library/posts/${postId}`,
      );
      if (!postResponse.ok) {
        throw new Error("Failed to load slideshow post");
      }

      const postData = (await postResponse.json()) as SlideshowPostDetail;
      const sortedSlides = [...(postData.slides ?? [])].sort(
        (a, b) => a.slideIndex - b.slideIndex,
      );
      const normalizedPost: SlideshowPostDetail = {
        ...postData,
        slides: sortedSlides,
      };

      setPostCache((prev) => ({
        ...prev,
        [normalizedPost.id]: normalizedPost,
      }));
      setSelectedPost(normalizedPost);
      setActiveSlideIndex(0);

      const accountId = postData.account?.id ?? postData.accountId;
      if (accountId) {
        const cached = accountCache[accountId];
        if (cached) {
          setSelectedAccount(cached);
        } else {
          try {
            const accountResponse = await fetch(
              `/api/slideshow-library/accounts/${accountId}`,
            );
            if (accountResponse.ok) {
              const accountData =
                (await accountResponse.json()) as SlideshowAccountDetail;
              setAccountCache((prev) => ({
                ...prev,
                [accountData.id]: accountData,
              }));
              setSelectedAccount(accountData);
              setPostCache((prev) => {
                const next = { ...prev };
                (accountData.posts ?? []).forEach((accountPost) => {
                  if (next[accountPost.id]) {
                    return;
                  }
                  const normalizedSlides = (accountPost.slides ?? []).map(
                    (slide, index) => ({
                      id: slide.id,
                      slideIndex: slide.slideIndex ?? index,
                      imageUrl: slide.imageUrl,
                      textContent: (slide as { textContent?: string })
                        .textContent,
                    }),
                  );
                  next[accountPost.id] = {
                    id: accountPost.id,
                    accountId: accountData.id,
                    caption: (accountPost as { caption?: string }).caption,
                    likeCount: accountPost.likeCount,
                    viewCount: accountPost.viewCount,
                    slides: normalizedSlides,
                    account: {
                      id: accountData.id,
                      username: accountData.username,
                      displayName: accountData.displayName,
                      profileImageUrl: accountData.profileImageUrl,
                      followerCount: accountData.followerCount,
                      followingCount: accountData.followingCount,
                    },
                  };
                });
                return next;
              });
            }
          } catch (accountError) {
            console.error("Error loading account details:", accountError);
          }
        }
      }
    } catch (error) {
      console.error("Error loading slideshow post:", error);
      if (!provisionalPost) {
        setModalError("Die Slideshow konnte nicht geladen werden.");
      }
    } finally {
      setIsModalLoading(false);
    }
  };

  const goToSlide = (direction: "prev" | "next") => {
    if (!selectedPost?.slides?.length) return;
    setActiveSlideIndex((current) => {
      if (direction === "prev") {
        return current === 0 ? current : current - 1;
      }
      if (direction === "next") {
        return current === selectedPost.slides.length - 1
          ? current
          : current + 1;
      }
      return current;
    });
  };

  const activeSlide =
    selectedPost?.slides && selectedPost.slides[activeSlideIndex]
      ? selectedPost.slides[activeSlideIndex]
      : null;

  const handlePromptSave = async () => {
    if (!selectedPost || !promptHasChanged || isSavingPrompt) {
      return;
    }
    setIsSavingPrompt(true);
    try {
      const normalizedDraft = normalizePrompt(promptDraft);
      const response = await fetch(
        `/api/slideshow-library/posts/${selectedPost.id}/prompt`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: normalizedDraft.length > 0 ? normalizedDraft : null,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ?? "Prompt konnte nicht gespeichert werden",
        );
      }

      const updatedPost = (await response.json()) as SlideshowPostDetail;
      setSelectedPost(updatedPost);
      setPromptDraft(updatedPost.prompt ?? "");

      setPostCache((prev) => ({
        ...prev,
        [updatedPost.id]: updatedPost,
      }));

      setPosts((prev) =>
        prev.map((post) =>
          post.id === updatedPost.id
            ? { ...post, prompt: updatedPost.prompt ?? null }
            : post,
        ),
      );

      setSelectedAccount((prev) => {
        if (!prev || prev.id !== updatedPost.accountId) {
          return prev;
        }
        return {
          ...prev,
          posts: prev.posts?.map((post) =>
            post.id === updatedPost.id
              ? { ...post, prompt: updatedPost.prompt ?? null }
              : post,
          ),
        };
      });

      setAccountCache((prev) => {
        const cached = prev[updatedPost.accountId];
        if (!cached) {
          return prev;
        }
        return {
          ...prev,
          [updatedPost.accountId]: {
            ...cached,
            posts: cached.posts?.map((post) =>
              post.id === updatedPost.id
                ? { ...post, prompt: updatedPost.prompt ?? null }
                : post,
            ),
          },
        };
      });

      toast.success("Prompt gespeichert");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Prompt konnte nicht gespeichert werden",
      );
    } finally {
      setIsSavingPrompt(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-start space-y-10 px-10 py-12">
      <AppLogo size={72} />

      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold">What are you creating today?</h1>

        <Link
          href="/dashboard/slideshows"
          className="flex h-auto flex-col items-start gap-3 rounded-md bg-background p-4 text-foreground ring-1 ring-border transition hover:bg-accent/80 hover:text-accent-foreground"
        >
          <Images className="h-7 w-7 text-blue-500" />
          <span className="flex flex-col items-start leading-tight">
            <span className="text-lg font-medium">Slideshows</span>
            <span className="text-base text-muted-foreground">
              Create slideshows
            </span>
          </span>
        </Link>
      </div>

      <section className="flex w-full max-w-7xl flex-col gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">
            SlidesCockpit Slideshow Library
          </h2>
          <p className="text-muted-foreground">
            See what TikToks businesses are posting
          </p>
        </div>

        {isLoadingPosts ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            Lade Slideshow Library...
          </div>
        ) : postCards.length === 0 ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            Keine Slideshow Posts gefunden.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {postCards.map((post) => (
              <button
                type="button"
                key={post.id}
                onClick={() => openPostModal(post.id)}
                className="group relative overflow-hidden rounded-xl border bg-muted/30 text-left transition hover:border-primary hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Slideshow ansehen"
              >
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt="Slideshow preview"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full min-h-[128px] items-center justify-center bg-muted text-sm text-muted-foreground">
                    Keine Vorschau
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
                  <div className="flex flex-col items-start gap-1 text-base font-medium text-white">
                    <span className="flex items-center gap-1">
                      <PlayIcon size={18} />
                      {formatCount(post.viewCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <HeartIcon size={18} />
                      {formatCount(post.likeCount)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="h-[80vh] max-h-[85vh] w-full max-w-6xl overflow-hidden p-0 sm:rounded-xl">
          {isModalLoading && !selectedPost ? (
            <div className="flex min-h-[420px] items-center justify-center p-10">
              <Spinner text="Lade Slideshow..." />
            </div>
          ) : modalError && !selectedPost ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 p-10 text-center text-muted-foreground">
              <p>{modalError}</p>
              <Button variant="outline" onClick={closeModal}>
                Schließen
              </Button>
            </div>
          ) : selectedPost ? (
            <div className="grid h-full grid-cols-1 md:grid-cols-[1.3fr_1fr]">
              <div className="relative flex h-full min-h-[420px] flex-col gap-4 bg-background p-6">
                <div className="relative flex flex-1 items-center justify-center">
                  <div className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border bg-muted">
                    {activeSlide?.imageUrl ? (
                      <img
                        src={activeSlide.imageUrl}
                        alt={`Slide ${activeSlideIndex + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-[520px] items-center justify-center text-muted-foreground">
                        Keine Slide Vorschau vorhanden
                      </div>
                    )}

                    {selectedPost.slides.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => goToSlide("prev")}
                          disabled={activeSlideIndex === 0}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90"
                        >
                          <ChevronLeft className="h-5 w-5" />
                          <span className="sr-only">Vorheriger Slide</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => goToSlide("next")}
                          disabled={
                            activeSlideIndex === selectedPost.slides.length - 1
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90"
                        >
                          <ChevronRight className="h-5 w-5" />
                          <span className="sr-only">Nächster Slide</span>
                        </Button>
                      </>
                    )}

                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/50 px-3 py-1">
                      {selectedPost.slides.map((slide, index) => (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => setActiveSlideIndex(index)}
                          aria-label={`Zu Slide ${index + 1} wechseln`}
                          className={cn(
                            "h-2.5 w-2.5 rounded-full transition",
                            index === activeSlideIndex
                              ? "bg-white"
                              : "bg-white/50 hover:bg-white/70",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 text-base font-semibold text-foreground">
                    <PlayIcon className="h-4 w-4" />
                    {formatCount(selectedPost.viewCount)} Views
                  </span>
                  <span className="flex items-center gap-1 text-base font-semibold text-foreground">
                    <HeartIcon className="h-4 w-4" />
                    {formatCount(selectedPost.likeCount)} Likes
                  </span>
                  {selectedPost.caption && (
                    <span className="line-clamp-2 text-sm">
                      „{selectedPost.caption}”
                    </span>
                  )}
                </div>
              </div>

              <div className="flex h-full flex-col border-t bg-muted/10 p-6 md:border-l md:border-t-0">
                <div className="mt-4 flex items-start gap-4">
                  {selectedPost.account?.profileImageUrl ? (
                    <img
                      src={selectedPost.account.profileImageUrl}
                      alt={selectedPost.account.displayName}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                      {selectedPost.account?.displayName
                        ?.charAt(0)
                        .toUpperCase() ?? "?"}
                    </div>
                  )}

                  <div className="flex flex-col gap-0">
                    <span className="text-xl font-semibold">
                      {selectedPost.account?.displayName ?? "Unbekannt"}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      {selectedPost.account?.username ?? "unbekannt"}
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <p className="font-bold text-lg text-zinc-900">
                        {formatCount(
                          selectedAccount?.followerCount ??
                            selectedPost.account?.followerCount ??
                            0,
                        )}{" "}
                        <span className="font-medium text-zinc-600">
                          followers
                        </span>
                      </p>
                      <p className="font-bold text-lg text-zinc-900">
                        {formatCount(
                          selectedAccount?.followingCount ??
                            selectedPost.account?.followingCount ??
                            0,
                        )}{" "}
                        <span className="font-medium text-zinc-600">
                          following
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                {selectedAccount?.bio && (
                  <p className="mt-2 text-base text-zinc-800 text-semibold">
                    {selectedAccount.bio}
                  </p>
                )}

                <div className="mt-6 text-base font-semibold">Recent Posts</div>
                <ScrollArea className="mt-3 flex-1 pr-1">
                  {selectedAccount?.posts &&
                  selectedAccount.posts.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedAccount.posts.map((post) => {
                        const firstSlide = post.slides?.[0];
                        const isActive = post.id === selectedPost.id;
                        return (
                          <button
                            key={post.id}
                            type="button"
                            onClick={() => openPostModal(post.id)}
                            className={cn(
                              "relative overflow-hidden rounded-xl border bg-background text-left transition hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                              isActive && "border-primary shadow-md",
                            )}
                            aria-label="Weitere Slideshow ansehen"
                          >
                            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
                              {firstSlide?.imageUrl ? (
                                <img
                                  src={firstSlide.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                  Keine Vorschau
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 flex flex-col gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
                                <span className="flex items-center gap-1">
                                  <PlayIcon className="h-3.5 w-3.5" />
                                  {formatCount(post.viewCount)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <HeartIcon className="h-3.5 w-3.5" />
                                  {formatCount(post.likeCount)}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-muted-foreground/20 p-6 text-sm text-muted-foreground">
                      Keine weiteren Slideshows vorhanden.
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center p-10 text-muted-foreground">
              Keine Daten verfügbar.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
