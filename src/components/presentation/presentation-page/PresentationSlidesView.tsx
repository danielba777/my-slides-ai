"use client";

import { DEFAULT_CANVAS, type CanvasDoc } from "@/canvas/types";
import { SlideContainer } from "@/components/presentation/presentation-page/SlideContainer";
import { usePresentationSlides } from "@/hooks/presentation/usePresentationSlides";
import { useSlideChangeWatcher } from "@/hooks/presentation/useSlideChangeWatcher";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import React from "react";
import { PresentModeHeader } from "../dashboard/PresentModeHeader";
import { ThinkingDisplay } from "../dashboard/ThinkingDisplay";
import { SortableSlide } from "./SortableSlide";
const SlideCanvas = dynamic(() => import("@/canvas/SlideCanvasAdapter"), {
  ssr: false,
});

// -- Small utility to wait for root image decode before mounting the canvas --
function useImageReady(url?: string) {
  const [ready, setReady] = React.useState(!url);
  React.useEffect(() => {
    let active = true;
    if (!url) {
      setReady(true);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    const markReady = () => active && setReady(true);
    // Prefer decode() to avoid showing half-rendered frames (Chrome/Firefox)
    img.src = url;
    if (typeof (img as any).decode === "function") {
      (img as any)
        .decode()
        .then(markReady)
        .catch(markReady);
    } else {
      img.onload = markReady;
      img.onerror = markReady;
    }
    return () => {
      active = false;
    };
  }, [url]);
  return ready;
}

// Child-Komponente, damit Hooks nicht in einer Schleife aufgerufen werden
function SlideFrame({
  slide,
  index,
  itemsLength,
  isPresenting,
}: {
  slide: any;
  index: number;
  itemsLength: number;
  isPresenting: boolean;
}) {
  const safeCanvas: CanvasDoc =
    (slide.canvas as CanvasDoc | undefined) ?? {
      width: DEFAULT_CANVAS.width,
      height: DEFAULT_CANVAS.height,
      bg: DEFAULT_CANVAS.bg,
      nodes: [],
      selection: [],
    };
  const imgUrl = slide.rootImage?.url as string | undefined;
  const imageReady = useImageReady(imgUrl);

  return (
    <SortableSlide id={slide.id} key={slide.id}>
      <div
        className={cn(
          `slide-wrapper slide-wrapper-${index} flex-shrink-0`,
          !isPresenting && "max-w-full",
        )}
      >
        <SlideContainer
          index={index}
          id={slide.id}
          slideWidth={undefined}
          slidesCount={itemsLength}
        >
          <div
            className={cn(
              `slide-container-${index}`,
              isPresenting && "h-screen w-screen",
            )}
          >
            {imageReady ? (
              <SlideCanvas
                doc={safeCanvas}
                onChange={(next: CanvasDoc) => {
                  const { slides, setSlides } = usePresentationState.getState();
                  const updated = slides.slice();
                  const indexToUpdate = updated.findIndex((x) => x.id === slide.id);
                  if (indexToUpdate < 0) return;
                  const current = updated[indexToUpdate];
                  if (!current) return;
                  if (current.canvas !== next) {
                    updated[indexToUpdate] = { ...current, canvas: next };
                    setSlides(updated);
                  }
                }}
              />
            ) : (
              // Placeholder hält den Platz und verhindert Schwarz-Blitzen
              <div
                className={cn(
                  "rounded-xl",
                  isPresenting ? "h-screen w-screen" : "h-[700px] w-[420px]",
                  "bg-black/90",
                )}
              />
            )}
          </div>
        </SlideContainer>
      </div>
    </SortableSlide>
  );
}

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
        strategy={horizontalListSortingStrategy}
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

        <div className="flex w-full items-start gap-8">
            {items.map((slide, index) => (
            <SlideFrame
              key={slide.id}
              slide={slide}
              index={index}
              itemsLength={items.length}
              isPresenting={isPresenting}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
