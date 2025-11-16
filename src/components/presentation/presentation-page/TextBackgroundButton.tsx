"use client";

import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { ensureCanvas } from "@/lib/canvasUtils";
import type { CanvasDoc, SlideTextElement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// Icon für Text Background (A mit Hintergrund)
const TextBackgroundIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    {...props}
  >
    {/* Hintergrundbox */}
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="3"
      fill="currentColor"
    />
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fontWeight="800"
      fontSize="14"
      fill="#fff"
    >
      A
    </text>
  </svg>
);

interface TextBackgroundButtonProps {
  index: number;
}

const ACTION_BUTTON_CLASSES =
  "inline-flex !h-11 !w-11 !p-0 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-md ring-1 ring-black/5 transition-colors hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-white/10 dark:text-white/80 dark:ring-white/20";

export function TextBackgroundButton({ index }: TextBackgroundButtonProps) {
  const { slides, setSlides } = usePresentationState();
  const [isBackgroundEnabled, setIsBackgroundEnabled] = useState(false);

  useEffect(() => {
    const slide = slides[index];
    if (!slide) return;

    const canvas = slide.canvas as CanvasDoc | undefined;
    if (!canvas?.nodes) return;

    // Prüfe ob irgendein Text-Element Hintergrund hat
    const hasBackground = canvas.nodes.some((node: any) => {
      if (node.type !== "text") return false;
      const textElement = node as SlideTextElement;
      const background = textElement.background;
      return background && (background.opacity ?? 0) > 0;
    });

    setIsBackgroundEnabled(hasBackground);
  }, [slides, index]);

  const toggleBackground = () => {
    const slide = slides[index];
    if (!slide) return;

    const canvas = ensureCanvas(slide.canvas as CanvasDoc | undefined);
    const updatedNodes = canvas.nodes.map((node: any) => {
      if (node.type !== "text") return node;

      const textElement = node as SlideTextElement;
      const background = textElement.background;
      const currentBackgroundEnabled = background && (background.opacity ?? 0) > 0;

      if (currentBackgroundEnabled) {
        // Hintergrund entfernen
        return {
          ...textElement,
          background: {
            ...(background ?? {}),
            opacity: 0,
            enabled: false,
          },
        };
      } else {
        // Hintergrund hinzufügen
        return {
          ...textElement,
          background: {
            enabled: true,
            mode: "block" as const,
            color: "#000000",
            opacity: 0.8,
            paddingX: 8,
            paddingY: 4,
            radius: 6,
            lineOverlap: 0,
          },
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
      className={cn(ACTION_BUTTON_CLASSES, isBackgroundEnabled && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400")}
      onClick={toggleBackground}
      aria-label="Toggle text background"
      title={isBackgroundEnabled ? "Remove text background" : "Add text background"}
    >
      <TextBackgroundIcon className="h-4 w-4" />
    </Button>
  );
}