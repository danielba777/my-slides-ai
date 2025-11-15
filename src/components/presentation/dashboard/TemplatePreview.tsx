"use client";

import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { HeartIcon, PlayIcon, X } from "lucide-react";
import { useMemo } from "react";

export function TemplatePreview() {
  const { selectedTemplate, setSelectedTemplate } = usePresentationState();

  const compactFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [],
  );

  if (!selectedTemplate) {
    return null;
  }

  const formatCount = (value: number) => compactFormatter.format(value);

  const slidesWithImages = selectedTemplate.slides.filter(
    (slide) => !!slide.imageUrl,
  );
  const hasExtraSlides = slidesWithImages.length > 5;
  const visibleSlides = slidesWithImages.slice(0, hasExtraSlides ? 4 : 5);
  const extraCount = hasExtraSlides ? slidesWithImages.length - 4 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-foreground">
          1. Prompt from Template
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedTemplate(null)}
          className="gap-2 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
          Clear Template
        </Button>
      </div>

      <div className="relative group rounded-xl border-2 border-primary bg-card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {visibleSlides.map((slide) => (
            <div
              key={slide.id}
              className="group/image relative overflow-hidden rounded-lg border bg-muted/30 aspect-[3/4] transition hover:border-primary/50 hover:shadow-md"
            >
              <img
                src={slide.imageUrl}
                alt="Template slide preview"
                className="h-full w-full object-cover transition duration-300 group-hover/image:scale-105"
              />
            </div>
          ))}
          {hasExtraSlides && (
            <div className="relative flex aspect-[3/4] items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40">
              <span className="text-sm font-semibold text-muted-foreground">
                +{extraCount}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <PlayIcon className="h-3.5 w-3.5" />
              {formatCount(selectedTemplate.viewCount)} Views
            </span>
            <span className="flex items-center gap-1.5">
              <HeartIcon className="h-3.5 w-3.5" />
              {formatCount(selectedTemplate.likeCount)} Likes
            </span>
          </div>
          <span className="font-medium">
            {selectedTemplate.slideCount} Slides
          </span>
        </div>
      </div>
    </div>
  );
}
