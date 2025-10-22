"use client";

import { AppLogo } from "@/components/logo/AppLogo";
import { HeartIcon, Images, PlayIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface SlideshowPost {
  id: string;
  likeCount: number;
  viewCount: number;
  slides: Array<{
    id: string;
    imageUrl: string;
  }>;
}

const compactNumberFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function DashboardHome() {
  const [posts, setPosts] = useState<SlideshowPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoadingPosts(true);
        const response = await fetch("/api/slideshow-library/posts");
        if (!response.ok) {
          throw new Error("Failed to load slideshow posts");
        }
        const data = (await response.json()) as SlideshowPost[];
        setPosts(
          Array.isArray(data)
            ? data.filter(
                (post) => Array.isArray(post.slides) && post.slides.length > 0,
              )
            : [],
        );
      } catch (error) {
        console.error(error);
        setPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    void loadPosts();
  }, []);

  const postCards = useMemo(() => {
    return posts.map((post) => {
      const primarySlide = post.slides[0];
      return {
        id: post.id,
        likeCount: post.likeCount,
        viewCount: post.viewCount,
        imageUrl: primarySlide?.imageUrl,
      };
    });
  }, [posts]);

  const formatCount = (value: number) => compactNumberFormatter.format(value);

  return (
    <div className="flex h-full w-full flex-col items-center justify-start space-y-10 px-10 py-12">
      <AppLogo size={72} />
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold">What are you creating today?</h1>
        <Link
          href="/dashboard/slideshows"
          className="flex flex-col h-auto items-start gap-3 rounded-md bg-background p-4 text-foreground ring-1 ring-border transition hover:bg-accent/80 hover:text-accent-foreground"
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {postCards.map((post) => (
              <div
                key={post.id}
                className="group relative overflow-hidden rounded-xl border bg-muted/30 cursor-pointer"
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
                    <div className="flex items-center justify-start gap-1">
                      <PlayIcon size={18} />
                      {formatCount(post.viewCount)}
                    </div>

                    <div className="flex items-center justify-start gap-1">
                      <HeartIcon size={18} />
                      {formatCount(post.likeCount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
