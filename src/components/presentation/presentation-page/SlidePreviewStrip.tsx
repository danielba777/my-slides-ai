"use client";

import type { PlateSlide } from "@/components/presentation/utils/parser";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface SlidePreviewStripProps {
  slides: PlateSlide[];
  currentSlideIndex: number;
  onSelect: (index: number) => void;
}

export function SlidePreviewStrip({
  slides,
  currentSlideIndex,
  onSelect,
}: SlidePreviewStripProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const active = itemRefs.current[currentSlideIndex];
    if (active) {
      active.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentSlideIndex, slides.length]);

  return (
    <div className="px-6 pb-4 pt-2 flex justify-center">
      <div
        ref={containerRef}
        className="flex items-center justify-center gap-2 overflow-x-auto"
        aria-label="Slide preview strip"
      >
        {slides.map((slide, index) => {
          const previewSrc =
            slide.canvas?.previewDataUrl ?? slide.rootImage?.url ?? undefined;
          return (
            <button
              key={slide.id ?? `${index}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                "w-12 h-12 rounded-[10px] flex-shrink-0 flex items-center justify-center p-[1px] transition-all duration-200 shadow-sm bg-white border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                currentSlideIndex === index
                  ? "border-[#388EFF]"
                  : "text-muted-foreground",
              )}
              aria-label={`Slide ${index + 1}`}
            >
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt={`Slide ${index + 1} preview`}
                  className="w-full h-full object-cover rounded-[8px]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-medium opacity-80">
                  {index + 1}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
