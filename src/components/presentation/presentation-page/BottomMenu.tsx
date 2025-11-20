"use client";

import { OutlineIcon } from "@/components/icons/OutlineIcon";
import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import React from "react";

export function BottomMenu() {
  const { slides, setSlides, currentSlideIndex } = usePresentationState();

  const toggleOutline = () => {
    const currentSlide = slides[currentSlideIndex];
    if (!currentSlide || !currentSlide.canvas) return;

    const newNodes = currentSlide.canvas.nodes.map((node) => {
      if (node.type === "text") {
        return {
          ...node,
          outlineEnabled: !(node as any).outlineEnabled,
        };
      }
      return node;
    });

    const newSlides = [...slides];
    newSlides[currentSlideIndex] = {
      ...currentSlide,
      canvas: {
        ...currentSlide.canvas,
        nodes: newNodes,
      },
    };

    setSlides(newSlides);
  };

  return (
    <div className="flex justify-center items-center gap-4 p-4">
      <Button variant="outline" disabled>
        Move
      </Button>
      <Button variant="outline" onClick={toggleOutline}>
        <OutlineIcon className="w-4 h-4 mr-2" />
        Toggle Outline
      </Button>
    </div>
  );
}
