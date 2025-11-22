"use client";

import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { ensureCanvas } from "@/lib/canvasUtils";
import type { CanvasDoc } from "@/canvas/types";
import type { SlideTextElement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// Icon für Text Outline (A mit Umriss)
const TextOutlineIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    {...props}
  >
    <defs>
      <filter id="stroke" colorInterpolationFilters="sRGB">
        <feMorphology
          operator="dilate"
          radius="1.2"
          in="SourceAlpha"
          result="DILATE"
        />
        <feColorMatrix
          type="matrix"
          values="
           0 0 0 0 0
           0 0 0 0 0
           0 0 0 0 0
           0 0 0 1 0"
          in="DILATE"
          result="BLACK"
        />
        <feMerge>
          <feMergeNode in="BLACK" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#stroke)">
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontWeight="700"
        fontSize="14"
        fill="currentColor"
      >
        A
      </text>
    </g>
  </svg>
);

interface TextOutlineButtonProps {
  index: number;
}

const ACTION_BUTTON_CLASSES =
  "inline-flex !h-11 !w-11 !p-0 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-md ring-1 ring-black/5 transition-colors hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-white/10 dark:text-white/80 dark:ring-white/20";

export function TextOutlineButton({ index }: TextOutlineButtonProps) {
  const { slides, setSlides } = usePresentationState();
  const [isOutlineEnabled, setIsOutlineEnabled] = useState(false);

  useEffect(() => {
    const slide = slides[index];
    if (!slide) return;

    const canvas = slide.canvas as CanvasDoc | undefined;
    if (!canvas?.nodes) return;

    // Prüfe ob irgendein Text-Element Outline hat
    const hasOutline = canvas.nodes.some((node: any) => {
      if (node.type !== "text") return false;
      const textElement = node as SlideTextElement;
      return (
        (textElement as any)?.strokeEnabled ??
        (textElement as any)?.outlineEnabled ??
        ((textElement as any)?.strokeWidth ?? 0) > 0
      );
    });

    setIsOutlineEnabled(hasOutline);
  }, [slides, index]);

  const toggleOutline = () => {
    const slide = slides[index];
    if (!slide) return;

    const canvas = ensureCanvas(slide.canvas as CanvasDoc | undefined);
    const updatedNodes = canvas.nodes.map((node: any) => {
      if (node.type !== "text") return node;

      const textElement = node as SlideTextElement;
      const currentOutlineEnabled =
        (textElement as any)?.strokeEnabled ??
        (textElement as any)?.outlineEnabled ??
        ((textElement as any)?.strokeWidth ?? 0) > 0;

      if (currentOutlineEnabled) {
        // Outline entfernen
        return {
          ...textElement,
          strokeEnabled: false,
          outlineEnabled: false,
          strokeWidth: 0,
          outlineWidth: 0,
        };
      } else {
        // Outline hinzufügen
        return {
          ...textElement,
          strokeEnabled: true,
          outlineEnabled: true,
          strokeWidth: 1,
          outlineWidth: 1,
          stroke: "#000000",
          outlineColor: "#000000",
        };
      }
    });

    const updatedCanvas = { ...canvas, nodes: updatedNodes };
    const updatedSlides = slides.slice();
    updatedSlides[index] = { ...slide, canvas: updatedCanvas };
    setSlides(updatedSlides);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(ACTION_BUTTON_CLASSES, isOutlineEnabled && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400")}
      onClick={toggleOutline}
      aria-label="Toggle text outline"
      title={isOutlineEnabled ? "Remove text outline" : "Add text outline"}
    >
      <TextOutlineIcon className="h-4 w-4" />
    </Button>
  );
}
