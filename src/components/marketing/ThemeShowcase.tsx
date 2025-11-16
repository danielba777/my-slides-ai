"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Section } from "./Section";

interface ThemeData {
  id: string;
  category: string;
  displayName?: string;
  icon?: string;
  showcaseDescription?: string;
  isActive: boolean;
  previewImages?: string[];
  postCount?: number;
}

export function MarketingThemeShowcase() {
  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setIsLoading(true);
      // Fetch themes
      const themesResponse = await fetch("/api/landing-page-themes", {
        cache: "no-store",
      });

      if (!themesResponse.ok) {
        throw new Error("Failed to load themes");
      }

      const themesData = await themesResponse.json();

      // Filter active themes and fetch preview images for each
      const activeThemes = themesData.filter(
        (theme: ThemeData) => theme.isActive,
      );

      const themesWithImages = await Promise.all(
        activeThemes.map(async (theme: ThemeData) => {
          try {
            const postsResponse = await fetch(
              `/api/slideshow-library/posts?category=${theme.category}&limit=2`,
              { cache: "no-store" },
            );

            if (postsResponse.ok) {
              const postsData = await postsResponse.json();
              const posts = Array.isArray(postsData)
                ? postsData
                : postsData.posts || [];
              const totalCount = Array.isArray(postsData)
                ? postsData.length
                : postsData.totalCount || 0;

              const previewImages = posts
                .slice(0, 2)
                .map((post: any) => post.slides?.[0]?.imageUrl)
                .filter(Boolean);

              return { ...theme, previewImages, postCount: totalCount };
            }
          } catch (error) {
            console.error(
              `Failed to load preview images for ${theme.category}:`,
              error,
            );
          }

          return { ...theme, previewImages: [], postCount: 0 };
        }),
      );

      setThemes(themesWithImages);
    } catch (error) {
      console.error("Error loading themes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (themes.length === 0) {
    return null;
  }

  return (
    <Section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900 leading-tight">
            🔥 New templates just dropped
          </h2>
          <p className="mt-4 text-lg text-zinc-600 font-semibold max-w-[30rem]">
            Choose from our curated themes and start creating engaging
            slideshows for your audience
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 justify-items-center max-w-4xl mx-auto">
          {themes.map((theme) => {
            return (
              <Link
                key={theme.id}
                href={`/${theme.category}`}
                className="group block h-full"
              >
                <Card className="overflow-hidden flex flex-col h-full transition-all duration-300 rounded-2xl border shadow-md hover:shadow-lg hover:border-blue-500">
                  {/* Preview Images */}
                  <div className="relative overflow-hidden">
                    {theme.previewImages && theme.previewImages.length > 0 ? (
                      <div className="flex gap-2 p-2">
                        {theme.previewImages
                          .slice(0, 2)
                          .map((imageUrl, idx) => (
                            <div
                              key={idx}
                              className="relative flex-1 aspect-[2/3] overflow-hidden"
                            >
                              <Image
                                src={imageUrl}
                                alt={`${theme.displayName || theme.category} preview ${idx + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover rounded-lg"
                              />
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-6xl">{theme.icon || "✨"}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-3">
                        <span className="text-2xl">{theme.icon || "✨"}</span>

                        <h3 className="text-2xl font-bold text-gray-900">
                          {theme.displayName || theme.category}
                        </h3>
                      </div>

                      {theme.showcaseDescription && (
                        <p className="text-gray-600 leading-relaxed mb-4">
                          {theme.showcaseDescription}
                        </p>
                      )}
                    </div>

                    {theme.postCount !== undefined && (
                      <Badge variant="secondary" className="mt-2 self-start">
                        {theme.postCount}{" "}
                        {theme.postCount === 1 ? "Post" : "Posts"}
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
