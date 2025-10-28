"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { HeartIcon, PlayIcon, StarIcon, TrendingUpIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Slide = {
  id: string;
  imageUrl: string;
  slideIndex?: number;
  textContent?: string;
};

type PostSummary = {
  id: string;
  likeCount: number;
  viewCount: number;
  slides: Slide[];
  title?: string;
  creator?: string;
};

type DisplayPost = {
  id: string;
  likeCount: number;
  viewCount: number;
  imageUrl: string | null;
  title: string;
  creator: string;
  trending: boolean;
  isPlaceholder?: boolean;
};

const fmt = new Intl.NumberFormat("de", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const formatCount = (value: number) => fmt.format(value);

const PLACEHOLDER_POSTS: DisplayPost[] = [
  {
    id: "placeholder-0",
    likeCount: 6_240,
    viewCount: 128_400,
    imageUrl: null,
    title: "Viral slideshow 1",
    creator: "Creator 1",
    trending: true,
    isPlaceholder: true,
  },
  {
    id: "placeholder-1",
    likeCount: 12_950,
    viewCount: 256_800,
    imageUrl: null,
    title: "Viral slideshow 2",
    creator: "Creator 2",
    trending: true,
    isPlaceholder: true,
  },
  {
    id: "placeholder-2",
    likeCount: 8_100,
    viewCount: 201_500,
    imageUrl: null,
    title: "Viral slideshow 3",
    creator: "Creator 3",
    trending: true,
    isPlaceholder: true,
  },
  {
    id: "placeholder-3",
    likeCount: 4_380,
    viewCount: 97_200,
    imageUrl: null,
    title: "Viral slideshow 4",
    creator: "Creator 4",
    trending: false,
    isPlaceholder: true,
  },
  {
    id: "placeholder-4",
    likeCount: 3_520,
    viewCount: 72_900,
    imageUrl: null,
    title: "Viral slideshow 5",
    creator: "Creator 5",
    trending: false,
    isPlaceholder: true,
  },
  {
    id: "placeholder-5",
    likeCount: 17_600,
    viewCount: 312_400,
    imageUrl: null,
    title: "Viral slideshow 6",
    creator: "Creator 6",
    trending: false,
    isPlaceholder: true,
  },
  {
    id: "placeholder-6",
    likeCount: 2_310,
    viewCount: 58_400,
    imageUrl: null,
    title: "Viral slideshow 7",
    creator: "Creator 7",
    trending: false,
    isPlaceholder: true,
  },
  {
    id: "placeholder-7",
    likeCount: 9_020,
    viewCount: 146_900,
    imageUrl: null,
    title: "Viral slideshow 8",
    creator: "Creator 8",
    trending: false,
    isPlaceholder: true,
  },
];

export function MarketingLibraryPreview() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/slideshow-library/posts", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load slideshow posts");
        const data = (await res.json()) as PostSummary[];
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
        setLoading(false);
      }
    };

    void load();
  }, []);

  const topEight = useMemo<DisplayPost[]>(() => {
    if (!posts.length) return [];
    return [...posts]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 8)
      .map((post, index) => ({
        id: post.id,
        likeCount: post.likeCount,
        viewCount: post.viewCount,
        imageUrl: post.slides?.[0]?.imageUrl ?? null,
        title: post.title || `Viral slideshow ${index + 1}`,
        creator: post.creator || `Creator ${index + 1}`,
        trending: index < 3,
      }));
  }, [posts]);

  const displayPosts =
    loading || !topEight.length ? PLACEHOLDER_POSTS : topEight;

  return (
    <section
      id="library"
      className="relative overflow-hidden px-5 pt-16 sm:px-6"
    >
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 space-y-6 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-100 to-[#c2d5ff] px-4 py-2 text-sm font-medium text-indigo-700">
            <TrendingUpIcon className="h-4 w-4" />
            Trending slides
          </div>

          <h2 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Discover real
            <span className="block bg-clip-text text-[#304674]">
              viral slides
            </span>
          </h2>

          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600">
            Watch how top creators use{" "}
            <span className="font-bold text-[#304674]">SlidesCockpit</span> to
            blow up their TikTok reach. Real examples, real growth.
          </p>

          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-500">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Real-time data
            </div>
            <div className="flex items-center gap-2">
              <StarIcon className="h-4 w-4 text-yellow-500" />
              Top performers
            </div>
            <div className="flex items-center gap-2">
              <PlayIcon className="h-4 w-4 text-blue-500" />
              Millions of views
            </div>
          </div>
        </motion.div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {displayPosts.map((post, index) => {
              const isPlaceholder = post.isPlaceholder;
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onHoverStart={
                    isPlaceholder ? undefined : () => setHoveredCard(post.id)
                  }
                  onHoverEnd={
                    isPlaceholder ? undefined : () => setHoveredCard(null)
                  }
                >
                  <Card
                    className={`group relative aspect-[9/16] overflow-hidden rounded-3xl border-2 border-gray-200/50 bg-white shadow-xl transition-all duration-500 ${
                      !isPlaceholder
                        ? "hover:scale-105 hover:border-indigo-300 hover:shadow-2xl"
                        : ""
                    } ${
                      hoveredCard === post.id ? "ring-4 ring-indigo-400/20" : ""
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {post.imageUrl && !isPlaceholder ? (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:rotate-1 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 text-sm font-medium">
                        <div className="text-center">
                          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-300">
                            <PlayIcon className="h-6 w-6 text-gray-600" />
                          </div>
                          {isPlaceholder ? "Loading preview" : "No preview"}
                        </div>
                      </div>
                    )}

                    {post.trending && !isPlaceholder ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="absolute right-3 top-3 z-10"
                      >
                        <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                          <StarIcon className="h-3 w-3 fill-white" />
                          Top {index + 1}
                        </div>
                      </motion.div>
                    ) : null}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 text-base font-semibold text-white">
                          <PlayIcon className="h-4 w-4" />
                          {formatCount(post.viewCount)} Views
                        </span>
                        <span className="flex items-center gap-1 text-base font-semibold text-white">
                          <HeartIcon className="h-4 w-4" />
                          {formatCount(post.likeCount)} Likes
                        </span>
                        {post.title && (
                          <span className="line-clamp-2 text-sm text-gray-200">
                            „{post.title}"
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
