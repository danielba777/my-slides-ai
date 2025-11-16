"use client";

import type { SlideCanvasAdapterHandle } from "@/canvas/SlideCanvasAdapter";
import { DEFAULT_CANVAS, type CanvasDoc } from "@/canvas/types";
import { SlideContainer } from "@/components/presentation/presentation-page/SlideContainer";
import { applyBackgroundImageToCanvas } from "@/components/presentation/utils/canvas";
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
import { Grid2x2, ImageIcon, Type } from "lucide-react";
import dynamic from "next/dynamic";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { PresentModeHeader } from "../dashboard/PresentModeHeader";
import { ThinkingDisplay } from "../dashboard/ThinkingDisplay";
import { MultiSlideImageSelector } from "./MultiSlideImageSelector";
import OverlayImageEditorLayer from "./OverlayImageEditorLayer";
import {
  SingleSlideImageSelector,
  type SelectedImageResult,
} from "./SingleSlideImageSelector";
import { SlidePreviewStrip } from "./SlidePreviewStrip";
import { SortableSlide } from "./SortableSlide";
import StickyDownloadActions from "./StickyDownloadActions";
const SlideCanvas = dynamic(() => import("@/canvas/SlideCanvasAdapter"), {
  ssr: false,
});


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
      
      if (previousBlobUrl && previousBlobUrl !== safeUrl) {
        revokeCorsSafeImageUrl(previousBlobUrl);
      }
      setSafeImgUrl(safeUrl);
      
      if (safeUrl.startsWith("blob:")) previousBlobUrl = safeUrl;
    })();
    return () => {
      active = false;
      if (previousBlobUrl) revokeCorsSafeImageUrl(previousBlobUrl);
    };
  }, [imgUrl]);

  
  const docWithBg = applyBackgroundImageToCanvas(
    safeCanvas,
    slide.rootImage?.useGrid ? null : safeImgUrl,
    slide.rootImage?.useGrid ? slide.rootImage.gridImages : null,
  );
  const imageReady = useImageReady(safeImgUrl);

  const canvasRef = useRef<SlideCanvasAdapterHandle | null>(null);

  
  const { editingSlideId, setEditingSlideId } = usePresentationState();
  const { editingOverlaySlideId, setEditingOverlaySlideId } =
    usePresentationState();
  const isEditingText = editingSlideId === slide.id;
  const [isHovering, setIsHovering] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [isMultiImageSelectorOpen, setIsMultiImageSelectorOpen] =
    useState(false);
  
  const disableInteractions = !!editingSlideId && editingSlideId !== slide.id;

  
  
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

  
  useEffect(() => {
    if (!isEditingText) {
      canvasRef.current?.clearTextFocus();
    }
  }, [isEditingText]);

  
  useEffect(() => {
    if (editingOverlaySlideId !== slide.id) return;
    const { slides, setSlides } = usePresentationState.getState();
    const updated = slides.slice();
    const i = updated.findIndex((x) => x.id === slide.id);
    if (i < 0) return;
    const current = updated[i];
    if (!current) return;
    const c = (current.canvas ?? {
      version: DEFAULT_CANVAS.version,
      width: DEFAULT_CANVAS.width,
      height: DEFAULT_CANVAS.height,
      bg: DEFAULT_CANVAS.bg,
      nodes: [],
      selection: [],
    }) as CanvasDoc;
    if (c.selection?.includes("user-overlay-image")) return;
    updated[i] = {
      ...current,
      canvas: { ...c, selection: ["user-overlay-image"] },
    };
    setSlides(updated);
  }, [editingOverlaySlideId, slide.id]);

  
  const handleImageSelect = (selection: SelectedImageResult) => {
    const { slides, setSlides } = usePresentationState.getState();
    const updated = slides.slice();
    const i = updated.findIndex((x) => x.id === slide.id);
    if (i < 0) return;

    const currentSlide = updated[i];
    if (!currentSlide) return;

    
    updated[i] = {
      ...currentSlide,
      rootImage: {
        query: currentSlide.rootImage?.query ?? "",
        url: selection.url,
        useGrid: false,
        gridImages: undefined,
        imageSetId: selection.imageSetId ?? currentSlide.rootImage?.imageSetId,
        imageSetName:
          selection.imageSetName ?? currentSlide.rootImage?.imageSetName,
        parentImageSetId:
          selection.parentSetId ??
          currentSlide.rootImage?.parentImageSetId ??
          null,
        parentImageSetName:
          selection.parentSetName ??
          currentSlide.rootImage?.parentImageSetName ??
          null,
        imageCategory:
          selection.category ?? currentSlide.rootImage?.imageCategory ?? null,
      },
    };
    setSlides(updated);
  };

  
  const handleMultiImageSelect = (imageUrls: string[]) => {
    const { slides, setSlides } = usePresentationState.getState();
    const updated = slides.slice();
    const i = updated.findIndex((x) => x.id === slide.id);
    if (i < 0) return;

    const currentSlide = updated[i];
    if (!currentSlide) return;

    updated[i] = {
      ...currentSlide,
      rootImage: {
        ...currentSlide.rootImage,
        query: currentSlide.rootImage?.query || "",
        gridImages: imageUrls.map((url) => ({ url })),
      },
    };
    setSlides(updated);
  };

  
  const toggleGridMode = () => {
    const { slides, setSlides } = usePresentationState.getState();
    const updated = slides.slice();
    const i = updated.findIndex((x) => x.id === slide.id);
    if (i < 0) return;

    const currentSlide = updated[i];
    if (!currentSlide?.rootImage) return;

    const useGrid = !currentSlide.rootImage.useGrid;
    updated[i] = {
      ...currentSlide,
      rootImage: {
        ...currentSlide.rootImage,
        useGrid,
        gridImages: useGrid
          ? currentSlide.rootImage.gridImages || [
              { url: currentSlide.rootImage.url },
              {},
              {},
              {},
            ]
          : undefined,
      },
    };
    setSlides(updated);
  };

  return (
    <>
      {}
      <SingleSlideImageSelector
        isOpen={isImageSelectorOpen}
        onClose={() => setIsImageSelectorOpen(false)}
        onSelectImage={handleImageSelect}
      />
      <MultiSlideImageSelector
        isOpen={isMultiImageSelectorOpen}
        onClose={() => setIsMultiImageSelectorOpen(false)}
        onSelectImages={handleMultiImageSelect}
        maxImages={4}
      />
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
              onMouseEnter={() =>
                !isPresenting &&
                !isReadOnly &&
                !editingSlideId &&
                setIsHovering(true)
              }
              onMouseLeave={() =>
                !isPresenting && !isReadOnly && setIsHovering(false)
              }
              
              onClick={() => {}}
            >
              {imageReady ? (
                <SlideCanvas
                  ref={canvasRef}
                  doc={docWithBg}
                  showToolbar={isEditingText}
                  readOnly={disableInteractions}
                  overlayContent={(() => {
                    const showHover =
                      !isPresenting &&
                      !isReadOnly &&
                      isHovering &&
                      !editingSlideId &&
                      editingOverlaySlideId !== slide.id;
                    const inOverlayEdit = editingOverlaySlideId === slide.id;
                    if (inOverlayEdit) {
                      return (
                        <>
                          <div className="absolute left-0 right-0 top-0 z-[6] flex justify-center pt-3 pointer-events-none">
                            <div className="flex gap-2 rounded-full bg-black/50 backdrop-blur-md px-2 py-1 pointer-events-auto">
                              <button
                                onClick={() => {
                                  setEditingOverlaySlideId(null);
                                  const { slides, setSlides } =
                                    usePresentationState.getState();
                                  const updated = slides.slice();
                                  const i = updated.findIndex(
                                    (x) => x.id === slide.id,
                                  );
                                  if (i >= 0) {
                                    const existing = updated[i];
                                    if (!existing) return;
                                    const c = (existing.canvas ??
                                      docWithBg) as CanvasDoc;
                                    updated[i] = {
                                      ...existing,
                                      canvas: { ...c, selection: [] },
                                    };
                                    setSlides(updated);
                                  }
                                }}
                                className="flex items-center gap-2 rounded-full bg-emerald-500/90 hover:bg-emerald-500 text-white px-3 py-1.5 shadow"
                                aria-label="Confirm"
                                title="Confirm"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  const { slides, setSlides } =
                                    usePresentationState.getState();
                                  const updated = slides.slice();
                                  const i = updated.findIndex(
                                    (x) => x.id === slide.id,
                                  );
                                  if (i >= 0) {
                                    const cur = updated[i];
                                    if (!cur) return;
                                    const c = (cur.canvas ??
                                      docWithBg) as CanvasDoc;
                                    const nodes = (c.nodes ?? []).filter(
                                      (n: any) =>
                                        !(
                                          n?.type === "image" &&
                                          n?.id === "user-overlay-image"
                                        ),
                                    );
                                    updated[i] = {
                                      ...cur,
                                      canvas: { ...c, nodes, selection: [] },
                                    };
                                    setSlides(updated);
                                  }
                                  setEditingOverlaySlideId(null);
                                }}
                                className="flex items-center gap-2 rounded-full bg-red-500/90 hover:bg-red-500 text-white px-3 py-1.5 shadow"
                                aria-label="Delete Image"
                                title="Delete Image"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                          <OverlayImageEditorLayer slideId={slide.id} />
                        </>
                      );
                    }
                    if (showHover) {
                      return (
                        <div className="relative flex flex-col h-full pointer-events-none">
                          {}
                          <button
                            onClick={() => {
                              setEditingSlideId(slide.id);
                              setIsHovering(false);
                              
                              setTimeout(() => {
                                canvasRef.current?.focusFirstText();
                              }, 100);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-black/50 hover:bg-black/60 transition-all backdrop-blur-sm pointer-events-auto cursor-pointer border-b border-white/20 group"
                          >
                            <Type aria-hidden className="h-6 w-6 text-white" />
                            <span className="text-white text-lg font-semibold group-hover:scale-105 transition-transform">
                              Edit Text
                            </span>
                          </button>
                          {}
                          <button
                            onClick={() => {
                              if (slide.rootImage?.useGrid) {
                                setIsMultiImageSelectorOpen(true);
                              } else {
                                setIsImageSelectorOpen(true);
                              }
                              setIsHovering(false);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-black/50 hover:bg-black/60 transition-all backdrop-blur-sm pointer-events-auto cursor-pointer group"
                          >
                            <ImageIcon
                              aria-hidden
                              className="h-6 w-6 text-white"
                            />
                            <span className="text-white text-lg font-semibold group-hover:scale-105 transition-transform">
                              {slide.rootImage?.useGrid
                                ? "Edit Images"
                                : "Edit Image"}
                            </span>
                          </button>
                          {}
                          {slide.rootImage && (
                            <button
                              onClick={() => {
                                toggleGridMode();
                                setIsHovering(false);
                              }}
                              className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg transition-all backdrop-blur-sm pointer-events-auto cursor-pointer shadow-lg"
                            >
                              {slide.rootImage.useGrid ? (
                                <>
                                  <ImageIcon className="h-4 w-4" />
                                  <span className="text-sm font-semibold">
                                    Single Image
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Grid2x2 className="h-4 w-4" />
                                  <span className="text-sm font-semibold">
                                    4 Images
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    }
                    return undefined;
                  })()}
                  onCloseToolbar={() => {
                    setEditingSlideId(null);
                    
                    canvasRef.current?.clearTextFocus();
                  }}
                  onChange={(next: CanvasDoc) => {
                    const { slides, setSlides } =
                      usePresentationState.getState();
                    const updated = slides.slice();
                    const i = updated.findIndex((x) => x.id === slide.id);
                    if (i < 0) return;
                    const current = updated[i];
                    if (!current) return;

                    const currCanvas = current.canvas as CanvasDoc | undefined;

                    
                    const currTextNodes = Array.isArray(currCanvas?.nodes)
                      ? currCanvas!.nodes.filter((n: any) => n?.type === "text")
                      : [];
                    const nextTextNodes = Array.isArray(next?.nodes)
                      ? next!.nodes.filter((n: any) => n?.type === "text")
                      : [];

                    let merged: CanvasDoc = next;
                    if (
                      currTextNodes.length > 0 &&
                      nextTextNodes.length === 0
                    ) {
                      
                      const otherNodes = Array.isArray(next?.nodes)
                        ? next.nodes.filter((n: any) => n?.type !== "text")
                        : [];
                      merged = {
                        ...next,
                        nodes: [...otherNodes, ...currTextNodes],
                      };
                    }

                    
                    if (currCanvas !== merged) {
                      updated[i] = { ...current, canvas: merged };
                      setSlides(updated);
                    }
                  }}
                />
              ) : (
                
                <SlideCanvas
                  doc={docWithBg}
                  showToolbar={isEditingText}
                  readOnly={disableInteractions}
                  overlayContent={
                    !isPresenting &&
                    !isReadOnly &&
                    isHovering &&
                    !editingSlideId ? (
                      <div className="flex flex-col h-full pointer-events-none">
                        {}
                        <button
                          onClick={() => {
                            setEditingSlideId(slide.id);
                            setIsHovering(false);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 bg-black/50 hover:bg-black/60 transition-all backdrop-blur-sm pointer-events-auto cursor-pointer border-b border-white/20 group"
                        >
                          <Type aria-hidden className="h-6 w-6 text-white" />
                          <span className="text-white text-lg font-semibold group-hover:scale-105 transition-transform">
                            Edit Text
                          </span>
                        </button>
                        {}
                        <button
                          onClick={() => {
                            setIsImageSelectorOpen(true);
                            setIsHovering(false);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 bg-black/50 hover:bg-black/60 transition-all backdrop-blur-sm pointer-events-auto cursor-pointer group"
                        >
                          <ImageIcon
                            aria-hidden
                            className="h-6 w-6 text-white"
                          />
                          <span className="text-white text-lg font-semibold group-hover:scale-105 transition-transform">
                            Edit Image
                          </span>
                        </button>
                      </div>
                    ) : undefined
                  }
                  onChange={() => {}}
                />
              )}
            </div>
          </SlideContainer>
        </div>
      </SortableSlide>
    </>
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
  const setCurrentSlideIndex = usePresentationState(
    (s) => s.setCurrentSlideIndex,
  );
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
  const { items, sensors, handleDragEnd, scrollToSlide } =
    usePresentationSlides();
  
  useSlideChangeWatcher({ debounceDelay: 600 });
  
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

  
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPresenting) return; 

      if (event.clientY < 100) {
        setShouldShowExitHeader(true);
      } else {
        setShouldShowExitHeader(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isPresenting]);

  const handlePreviewSelect = useCallback(
    (index: number) => {
      setCurrentSlideIndex(index);
      scrollToSlide(index);
    },
    [scrollToSlide, setCurrentSlideIndex],
  );

  
  const SLIDE_GAP_PX = 32; 

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      {}
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

            <div className="relative px-6 py-4 h-[900px] flex items-start justify-center overflow-x-hidden overflow-y-visible">
              {items.map((slide, index) => {
                const offset = index - currentSlideIndex;
                const isActive = offset === 0;

                return (
                  <div
                    key={slide.id}
                    className={cn(
                      "absolute mb-8 transition-transform duration-300 ease-in-out",
                      isActive ? "drop-shadow-xl" : "drop-shadow-md",
                    )}
                    style={{
                      transform: `translateX(calc(${offset} * (100% + ${SLIDE_GAP_PX}px))) scale(${isActive ? 1 : 0.95})`,
                      opacity: isActive ? 1 : 0.8,
                      zIndex: items.length - Math.abs(offset),
                      visibility: Math.abs(offset) > 4 ? "hidden" : "visible",
                    }}
                    onClick={() => {
                      if (!isPresenting) {
                        setCurrentSlideIndex(index);
                      }
                    }}
                  >
                    <SlideFrame
                      slide={slide}
                      index={index}
                      slidesCount={items.length}
                      isPresenting={isPresenting}
                      isReadOnly={false}
                    />
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      {!isPresenting && (
        <SlidePreviewStrip
          slides={items}
          currentSlideIndex={currentSlideIndex}
          onSelect={handlePreviewSelect}
        />
      )}
    </div>
  );
};
