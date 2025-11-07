"use client";

import {
  HeartIcon,
  PlayIcon,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type SlideshowPostSlide = {
  id: string;
  imageUrl: string;
  slideIndex?: number;
};

type SlideshowPostAccount = {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string | null;
  followerCount?: number | null;
};

export type UserCollectedPost = {
  id: string;
  postId: string;
  caption?: string | null;
  likeCount: number;
  viewCount: number;
  publishedAt: string;
  createdAt: string;
  account?: SlideshowPostAccount | null;
  slides: SlideshowPostSlide[];
};

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCount = (value: number) => compactNumber.format(value);

type SortOption = "views-desc" | "views-asc" | "likes-desc" | "likes-asc";

export function PostCollectionsClient() {
  const [posts, setPosts] = useState<UserCollectedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        "/api/slideshow-library/user/posts?limit=120",
      );
      if (!response.ok) {
        const body = await response
          .json()
          .catch(() => ({ error: "Failed to load posts" }));
        throw new Error(
          typeof body?.error === "string" ? body.error : "Failed to load posts",
        );
      }

      const data = await response.json();
      const sanitized: UserCollectedPost[] = Array.isArray(data)
        ? data.filter(
            (post): post is UserCollectedPost =>
              post &&
              typeof post === "object" &&
              Array.isArray((post as any).slides) &&
              (post as any).slides.length > 0,
          )
        : [];

      setPosts(sanitized);
    } catch (err) {
      console.error("[post-collections] load failed", err);
      setError(err instanceof Error ? err.message : "Failed to load posts");
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const [sortOption, setSortOption] = useState<SortOption>("views-desc");

  const cardItems = useMemo(
    () =>
      posts.map((post) => ({
        id: post.id,
        imageUrl: post.slides?.[0]?.imageUrl ?? null,
        likeCount: post.likeCount ?? 0,
        viewCount: post.viewCount ?? 0,
        post,
      })),
    [posts],
  );

  const sortedCards = useMemo(() => {
    switch (sortOption) {
      case "views-asc":
        return [...cardItems].sort((a, b) => a.viewCount - b.viewCount);
      case "likes-desc":
        return [...cardItems].sort((a, b) => b.likeCount - a.likeCount);
      case "likes-asc":
        return [...cardItems].sort((a, b) => a.likeCount - b.likeCount);
      case "views-desc":
      default:
        return [...cardItems].sort((a, b) => b.viewCount - a.viewCount);
    }
  }, [cardItems, sortOption]);

  const handleCardClick = useCallback((post: UserCollectedPost) => {
    const username = post.account?.username;
    if (!username) {
      return;
    }
    const url = `https://www.tiktok.com/@${username}/video/${post.postId}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">
          Loading your saved posts…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={() => void loadPosts()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (sortedCards.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 p-10 text-center">
        <p className="text-lg font-semibold">No posts saved yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the SlidesCockpit Chrome Extension to import TikTok posts. They
          will appear here once the import has finished.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-6"
          onClick={() => void loadPosts()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">My Post Collections</h2>
          <p className="text-muted-foreground">
            Saved TikTok posts imported through the SlidesCockpit Chrome
            Extension.
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-card text-foreground border border-border shadow-sm hover:bg-card/90"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setSortOption("views-desc")}
                className={cn(
                  sortOption === "views-desc" &&
                    "bg-primary/10 text-primary font-medium",
                )}
              >
                Views (Most)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortOption("views-asc")}
                className={cn(
                  sortOption === "views-asc" &&
                    "bg-primary/10 text-primary font-medium",
                )}
              >
                Views (Least)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortOption("likes-desc")}
                className={cn(
                  sortOption === "likes-desc" &&
                    "bg-primary/10 text-primary font-medium",
                )}
              >
                Likes (Most)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortOption("likes-asc")}
                className={cn(
                  sortOption === "likes-asc" &&
                    "bg-primary/10 text-primary font-medium",
                )}
              >
                Likes (Least)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {sortedCards.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => handleCardClick(item.post)}
            className="group relative block aspect-[2/3] w-full overflow-hidden rounded-xl border bg-muted/30 text-left transition hover:border-primary hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Open TikTok post"
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt="Post preview"
                className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground">
                No preview
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
              <div className="flex flex-col items-start gap-1 text-base font-medium text-white">
                <span className="flex items-center gap-1">
                  <PlayIcon className="h-5 w-5" />
                  {formatCount(item.viewCount)}
                </span>
                <span className="flex items-center gap-1">
                  <HeartIcon className="h-5 w-5" />
                  {formatCount(item.likeCount)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
