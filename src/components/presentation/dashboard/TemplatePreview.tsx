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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-foreground">
          Selected Template
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
          {selectedTemplate.slides
            .filter((slide) => slide.imageUrl)
            .map((slide, index) => (
              <div
                key={slide.id}
                className="group/image relative overflow-hidden rounded-lg border bg-muted/30 aspect-[3/4] transition hover:border-primary/50 hover:shadow-md"
              >
                <img
                  src={slide.imageUrl}
                  alt={`Slide ${index + 1}`}
                  className="h-full w-full object-cover transition duration-300 group-hover/image:scale-105"
                />
                <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                  <span className="text-[10px] font-medium text-white">
                    {index + 1}
                  </span>
                </div>
              </div>
            ))}
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
