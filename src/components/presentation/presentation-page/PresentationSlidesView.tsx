"use client";

import type { SlideCanvasAdapterHandle } from "@/canvas/SlideCanvasAdapter";
import {
  DEFAULT_CANVAS,
  type CanvasDoc,
  type CanvasImageNode,
} from "@/canvas/types";
import { SlideContainer } from "@/components/presentation/presentation-page/SlideContainer";
import { applyBackgroundImageToCanvas } from "@/components/presentation/utils/canvas";
import { Button } from "@/components/ui/button";
import { usePresentationSlides } from "@/hooks/presentation/usePresentationSlides";
import { useSlideChangeWatcher } from "@/hooks/presentation/useSlideChangeWatcher";
import {
  getCorsSafeImageUrl,
  revokeCorsSafeImageUrl,
} from "@/lib/canvasImageCors";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import dynamic from "next/dynamic";
import React, { memo, useEffect, useRef, useState } from "react";
import { PresentModeHeader } from "../dashboard/PresentModeHeader";
import { ThinkingDisplay } from "../dashboard/ThinkingDisplay";
import { SortableSlide } from "./SortableSlide";
import StickyDownloadActions from "./StickyDownloadActions";
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
      (img as any).decode().then(markReady).catch(markReady);
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

// ✅ Child-Komponente, damit der Hook NICHT in einer Schleife aufgerufen wird
const SlideFrame = memo(function SlideFrame({
  slide,
  index,
  isPresenting,
  slidesCount,
  isReadOnly = false,
}: {
  slide: any;
  index: number;
  isPresenting: boolean;
  slidesCount: number;
  isReadOnly?: boolean;
}) {
  const safeCanvas: CanvasDoc = (slide.canvas as CanvasDoc | undefined) ?? {
    version: DEFAULT_CANVAS.version,
    width: DEFAULT_CANVAS.width,
    height: DEFAULT_CANVAS.height,
    bg: DEFAULT_CANVAS.bg,
    nodes: [],
    selection: [],
  };
  const imgUrl = slide.rootImage?.url as string | undefined;

  // Bild-URL CORS-sicher machen, damit Canvas-Export nicht "tainted" ist
  const [safeImgUrl, setSafeImgUrl] = useState<string | undefined>(imgUrl);
  useEffect(() => {
    let active = true;
    let previousBlobUrl: string | null = null;
    if (!imgUrl) {
      setSafeImgUrl(undefined);
      return () => {
        active = false;
        if (previousBlobUrl) revokeCorsSafeImageUrl(previousBlobUrl);
      };
    }
    (async () => {
      const safeUrl = await getCorsSafeImageUrl(imgUrl);
      if (!active) return;
      // Wenn wir eine neue blob:-URL erzeugen, alte aufräumen
      if (previousBlobUrl && previousBlobUrl !== safeUrl) {
        revokeCorsSafeImageUrl(previousBlobUrl);
      }
      setSafeImgUrl(safeUrl);
      // Merken, um beim nächsten Durchlauf zu revoken
      if (safeUrl.startsWith("blob:")) previousBlobUrl = safeUrl;
    })();
    return () => {
      active = false;
      if (previousBlobUrl) revokeCorsSafeImageUrl(previousBlobUrl);
    };
  }, [imgUrl]);

  // BG-Image direkt in den Canvas-Daten verankern, ohne Text zu verlieren
  const docWithBg = applyBackgroundImageToCanvas(safeCanvas, safeImgUrl);
  const imageReady = useImageReady(safeImgUrl);

  const canvasRef = useRef<SlideCanvasAdapterHandle | null>(null);

  // Registriere pro Slide einen Exporter in einer globalen Map, damit der Header
  // zentral in der aktuellen Reihenfolge exportieren kann.
  useEffect(() => {
    (window as any).__slideExporters =
      (window as any).__slideExporters ||
      new Map<string, () => Promise<Blob>>();
    const map: Map<string, () => Promise<Blob>> = (window as any)
      .__slideExporters;
    const exporter = async () => {
      return (
        (await canvasRef.current?.exportPNG?.()) ??
        new Blob([], { type: "image/png" })
      );
    };
    map.set(slide.id, exporter);
    return () => {
      map.delete(slide.id);
    };
  }, [slide?.id]);
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
          slidesCount={slidesCount}
        >
          <div
            className={cn(
              `slide-container-${index}`,
              isPresenting && "h-screen w-screen",
            )}
          >
            {imageReady ? (
              <SlideCanvas
                ref={canvasRef}
                doc={docWithBg}
                onChange={(next: CanvasDoc) => {
                  const { slides, setSlides } = usePresentationState.getState();
                  const updated = slides.slice();
                  const i = updated.findIndex((x) => x.id === slide.id);
                  if (i < 0) return;
                  const current = updated[i];
                  if (!current) return;

                  const currCanvas = current.canvas as CanvasDoc | undefined;

                  // 🛡️ SAFETY MERGE: verliere nie Textknoten beim Update
                  const currTextNodes = Array.isArray(currCanvas?.nodes)
                    ? currCanvas!.nodes.filter((n: any) => n?.type === "text")
                    : [];
                  const nextTextNodes = Array.isArray(next?.nodes)
                    ? next!.nodes.filter((n: any) => n?.type === "text")
                    : [];

                  let merged: CanvasDoc = next;
                  if (currTextNodes.length > 0 && nextTextNodes.length === 0) {
                    // Race: next hat (noch) keine Texte → Texte aus current konservieren
                    const otherNodes = Array.isArray(next?.nodes)
                      ? next.nodes.filter((n: any) => n?.type !== "text")
                      : [];
                    merged = {
                      ...next,
                      nodes: [...otherNodes, ...currTextNodes],
                    };
                  }

                  // Nur setzen, wenn sich tatsächlich was geändert hat
                  if (currCanvas !== merged) {
                    updated[i] = { ...current, canvas: merged };
                    setSlides(updated);
                  }
                }}
              />
            ) : (
              // Stabiles Placeholder, aber KEIN Entfernen/Neu-Erzeugen der Nodes
              <SlideCanvas doc={docWithBg} onChange={() => {}} />
            )}
          </div>

          {/* Untere Toolbar unter dem Canvas */}
          {!isPresenting && !isReadOnly && (
            <div
              className={cn("z-[1001] mt-3 w-full")}
              aria-label="Slide toolbar"
            >
              <div className="mx-auto flex w-full max-w-[760px] items-center justify-center gap-2 rounded-md bg-background/95 p-2 shadow-sm backdrop-blur">
                {/* ➕ Insert Image (Overlay) */}
                <input
                  id={`overlay-upload-${slide.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    const { slides, setSlides } =
                      usePresentationState.getState();
                    const updated = slides.slice();
                    const i = updated.findIndex((x) => x.id === slide.id);
                    if (i < 0) return;
                    const currentSlide = updated[i];
                    if (!currentSlide) return;
                    const c = (currentSlide.canvas as CanvasDoc) ?? {
                      ...DEFAULT_CANVAS,
                      width: DEFAULT_CANVAS.width,
                      height: DEFAULT_CANVAS.height,
                    };
                    const id = crypto.randomUUID();
                    const newNode: CanvasImageNode = {
                      id,
                      type: "image",
                      x: Math.round(c.width * 0.5 - 150),
                      y: Math.round(c.height * 0.7 - 150),
                      width: 300,
                      height: 300,
                      url,
                    };
                    updated[i] = {
                      ...currentSlide,
                      canvas: {
                        ...c,
                        nodes: [...(c.nodes ?? []), newNode],
                        selection: [id],
                      },
                    };
                    setSlides(updated);
                    // Reset input so selecting the same file again is possible
                    e.currentTarget.value = "";
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 rounded-md"
                  onClick={() => {
                    const el = document.getElementById(
                      `overlay-upload-${slide.id}`,
                    ) as HTMLInputElement | null;
                    el?.click();
                  }}
                  title="Insert Image (Overlay)"
                >
                  Insert Image
                </Button>
              </div>
            </div>
          )}
        </SlideContainer>
      </div>
    </SortableSlide>
  );
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
    <div className="w-full h-full overflow-hidden flex flex-col">
      {/* Fixierter Download-Button oben rechts – nur im Edit-Modus */}
      {!isPresenting && <StickyDownloadActions />}

      <div className="flex-1 overflow-auto">
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

            <div className="flex items-start gap-6 px-6 py-4">
              {items.map((slide, index) => (
                <SlideFrame
                  key={slide.id}
                  slide={slide}
                  index={index}
                  slidesCount={items.length}
                  isPresenting={isPresenting}
                  isReadOnly={false}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
