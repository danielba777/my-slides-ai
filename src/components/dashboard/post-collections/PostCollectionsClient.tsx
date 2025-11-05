"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Heart, RefreshCw, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const gridPosts = useMemo(
    () =>
      posts.map((post) => ({
        ...post,
        coverImage: post.slides?.[0]?.imageUrl ?? null,
        accountLabel:
          post.account?.displayName ?? post.account?.username ?? "Unknown",
      })),
    [posts],
  );

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

  if (gridPosts.length === 0) {
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
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {gridPosts.length}{" "}
          {gridPosts.length === 1 ? "post saved" : "posts saved"}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => void loadPosts()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-260px)] pr-2">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {gridPosts.map((post) => (
          <Card
            key={post.id}
            className="overflow-hidden border border-border/60 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75"
          >
            <div className="relative aspect-[3/4] bg-muted">
              {post.coverImage ? (
                <Image
                  src={post.coverImage}
                  alt={post.caption ?? "Post cover"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                  priority={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  No preview
                </div>
              )}
            </div>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                {post.account?.profileImageUrl ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={post.account.profileImageUrl}
                      alt={post.accountLabel}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <UserCircle className="h-10 w-10 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium leading-tight">
                    {post.accountLabel}
                  </p>
                  {post.account?.username && (
                    <p className="text-xs text-muted-foreground">
                      @{post.account.username}
                    </p>
                  )}
                </div>
              </div>

              <p className="line-clamp-3 text-sm text-muted-foreground">
                {post.caption?.trim() || "No caption provided."}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {formatCount(post.viewCount)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {formatCount(post.likeCount)}
                </span>
                <span>
                  Saved{" "}
                  {new Date(post.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className={cn(
                    "w-full sm:w-auto",
                    !post.account?.username && "pointer-events-none opacity-60",
                  )}
                  disabled={!post.account?.username}
                  onClick={() => {
                    if (!post.account?.username) return;
                    const url = `https://www.tiktok.com/@${post.account.username}/video/${post.postId}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                >
                  Open on TikTok
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </ScrollArea>
    </div>
  );
}
