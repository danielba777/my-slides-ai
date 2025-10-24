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
  trending?: boolean;
};

const fmt = new Intl.NumberFormat("de", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const formatCount = (v: number) => fmt.format(v);

export function MarketingLibraryPreview() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/slideshow-library/posts");
      if (!res.ok) throw new Error("Failed to load slideshow posts");
      const data = (await res.json()) as PostSummary[];
      const sanitized = Array.isArray(data)
        ? data.filter((p) => Array.isArray(p.slides) && p.slides.length > 0)
        : [];
      setPosts(sanitized);
    } catch (e) {
      console.error(e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const topEight = useMemo(() => {
    return [...posts]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 8)
      .map((p, index) => ({
        id: p.id,
        likeCount: p.likeCount,
        viewCount: p.viewCount,
        imageUrl: p.slides?.[0]?.imageUrl ?? null,
        title: p.title || `Viral Slideshow ${index + 1}`,
        creator: p.creator || `Creator ${index + 1}`,
        trending: index < 3,
      }));
  }, [posts]);

  return (
    <section
      id="library"
      className="relative pt-16 px-5 sm:px-6 overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-6 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-[#c2d5ff] rounded-full text-sm font-medium text-indigo-700 mb-4">
            <TrendingUpIcon className="w-4 h-4" />
            Trending Slides
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            Entdecke echte
            <span className="block bg-clip-text text-[#304674]">
              virale Slides
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Sehe, wie Top-Creator mit{" "}
            <span className="font-bold text-[#304674]">SlidesCockpit</span> ihre
            TikTok-Reichweite explodieren lassen. Echte Beispiele, echtes
            Wachstum.
          </p>

          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Echtzeit-Daten
            </div>
            <div className="flex items-center gap-2">
              <StarIcon className="w-4 h-4 text-yellow-500" />
              Top-Performer
            </div>
            <div className="flex items-center gap-2">
              <PlayIcon className="w-4 h-4 text-blue-500" />
              Millionen Views
            </div>
          </div>
        </motion.div>

        {/* 4 pro Reihe oben (slice 0-8) */}
        <div className="relative">
          {/* Top 8 Kacheln in 4x2 Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
            {topEight.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onHoverStart={() => setHoveredCard(post.id)}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <Card
                  className={`group relative aspect-[9/16] overflow-hidden rounded-3xl border-2 border-gray-200/50 bg-white shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:border-indigo-300 ${
                    hoveredCard === post.id ? "ring-4 ring-indigo-400/20" : ""
                  }`}
                >
                  {/* Background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110 group-hover:rotate-1"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 text-sm font-medium">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                          <PlayIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        No preview
                      </div>
                    </div>
                  )}

                  {/* Top Performer Badge */}
                  {post.trending && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="absolute top-3 right-3 z-10"
                    >
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-lg">
                        <StarIcon className="w-3 h-3 fill-white" />
                        Top {index + 1}
                      </div>
                    </motion.div>
                  )}

                  {/* Enhanced Content Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                    <div className="space-y-3">
                      {/* Title */}
                      <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">
                        {post.title}
                      </h3>

                      {/* Creator */}
                      <div className="text-xs text-gray-300 font-medium">
                        von {post.creator}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                            <PlayIcon size={12} className="text-white" />
                            {formatCount(post.viewCount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                            <HeartIcon size={12} className="text-red-400" />
                            {formatCount(post.likeCount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
