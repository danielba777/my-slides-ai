"use client";

import type { CanvasDoc } from "@/canvas/types";
import { SlideContainer } from "@/components/presentation/presentation-page/SlideContainer";
import { usePresentationSlides } from "@/hooks/presentation/usePresentationSlides";
import { useSlideChangeWatcher } from "@/hooks/presentation/useSlideChangeWatcher";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { PresentModeHeader } from "../dashboard/PresentModeHeader";
import { ThinkingDisplay } from "../dashboard/ThinkingDisplay";
import { SortableSlide } from "./SortableSlide";
const SlideCanvas = dynamic(() => import("@/canvas/SlideCanvasAdapter"), {
  ssr: false,
});

interface PresentationSlidesViewProps {
  isGeneratingPresentation: boolean;
}

export const PresentationSlidesView = ({
  isGeneratingPresentation,
}: PresentationSlidesViewProps) => {
  const currentSlideIndex = usePresentationState((s) => s.currentSlideIndex);
  const isPresenting = usePresentationState((s) => s.isPresenting);
  const nextSlide = usePresentationState((s) => s.nextSlide);
  const previousSlide = usePresentationState((s) => s.previousSlide);
  const setShouldShowExitHeader = usePresentationState(
    (s) => s.setShouldShowExitHeader,
  );
  const currentPresentationTitle = usePresentationState(
    (s) => s.currentPresentationTitle,
  );
  const shouldShowExitHeader = usePresentationState(
    (s) => s.shouldShowExitHeader,
  );
  const { items, sensors, handleDragEnd } = usePresentationSlides();
  // Use the slide change watcher to automatically save changes
  useSlideChangeWatcher({ debounceDelay: 600 });
  // Handle keyboard navigation in presentation mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPresenting) return;
      if (event.key === "ArrowRight" || event.key === "Space") {
        nextSlide();
      } else if (event.key === "ArrowLeft") {
        previousSlide();
      } else if (event.key === "Escape") {
        usePresentationState.getState().setIsPresenting(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, previousSlide, isPresenting]);

  // Handle showing header on mouse move
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPresenting) return; // Only show header when in presentation mode

      if (event.clientY < 100) {
        setShouldShowExitHeader(true);
      } else {
        setShouldShowExitHeader(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isPresenting]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <PresentModeHeader
          presentationTitle={currentPresentationTitle}
          showHeader={isPresenting && shouldShowExitHeader}
        />

        <ThinkingDisplay
          thinking={usePresentationState.getState().presentationThinking}
          isGenerating={isGeneratingPresentation}
          title="AI is thinking about your presentation..."
        />

        {items.map((slide, index) => (
          <SortableSlide id={slide.id} key={slide.id}>
            <div className={`slide-wrapper slide-wrapper-${index} w-full`}>
              <SlideContainer
                index={index}
                id={slide.id}
                slideWidth={undefined}
                slidesCount={items.length}
              >
                <div
                  className={cn(
                    `slide-container-${index}`,
                    isPresenting && "h-screen w-screen",
                  )}
                >
                  <SlideCanvas
                    doc={slide.canvas as CanvasDoc}
                    onChange={(next: CanvasDoc) => {
                      const { slides, setSlides } =
                        usePresentationState.getState();
                      const updated = slides.slice();
                      const indexToUpdate = updated.findIndex(
                        (x) => x.id === slide.id,
                      );
                      if (indexToUpdate < 0) return;
                      const current = updated[indexToUpdate];
                      if (!current) return;
                      updated[indexToUpdate] = { ...current, canvas: next };
                      setSlides(updated);
                    }}
                  />
                </div>
              </SlideContainer>
            </div>
          </SortableSlide>
        ))}
      </SortableContext>
    </DndContext>
  );
};
