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
import React, { memo, useEffect, useRef, useState } from "react";
import { PresentModeHeader } from "../dashboard/PresentModeHeader";
import { ThinkingDisplay } from "../dashboard/ThinkingDisplay";
import { MultiSlideImageSelector } from "./MultiSlideImageSelector";
import OverlayImageEditorLayer from "./OverlayImageEditorLayer";
import { SingleSlideImageSelector } from "./SingleSlideImageSelector";
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
  const docWithBg = applyBackgroundImageToCanvas(
    safeCanvas,
    slide.rootImage?.useGrid ? null : safeImgUrl,
    slide.rootImage?.useGrid ? slide.rootImage.gridImages : null,
  );
  const imageReady = useImageReady(safeImgUrl);

  const canvasRef = useRef<SlideCanvasAdapterHandle | null>(null);

  // Edit-Modus State: nur wenn aktiv, wird die Toolbar angezeigt
  const { editingSlideId, setEditingSlideId } = usePresentationState();
  const { editingOverlaySlideId, setEditingOverlaySlideId } = usePresentationState();
  const isEditingText = editingSlideId === slide.id;
  const [isHovering, setIsHovering] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [isMultiImageSelectorOpen, setIsMultiImageSelectorOpen] =
    useState(false);

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

  // Entferne Text-Fokus, wenn der Edit-Modus dieser Slide beendet wird
  useEffect(() => {
    if (!isEditingText) {
      canvasRef.current?.clearTextFocus();
    }
  }, [isEditingText]);

  // Wenn Overlay-Editmodus aktiv: sicherstellen, dass das persönliche Bild selektiert ist
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
    updated[i] = { ...current, canvas: { ...c, selection: ["user-overlay-image"] } };
    setSlides(updated);
  }, [editingOverlaySlideId, slide.id]);

  // Handler für die Bild-Auswahl
  const handleImageSelect = (imageUrl: string) => {
    const { slides, setSlides } = usePresentationState.getState();
    const updated = slides.slice();
    const i = updated.findIndex((x) => x.id === slide.id);
    if (i < 0) return;

    const currentSlide = updated[i];
    if (!currentSlide) return;

    // Update nur das rootImage dieser Slide
    updated[i] = {
      ...currentSlide,
      rootImage: { url: imageUrl, query: "" },
    };
    setSlides(updated);
  };

  // Handler für die Multi-Bild-Auswahl
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

  // Toggle zwischen Single und Grid Mode
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
      {/* Image Selector Modals */}
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
              onClick={() => {
                // Wenn eine andere Slide im Edit-Modus ist, schließe diesen
                if (editingSlideId && editingSlideId !== slide.id) {
                  setEditingSlideId(null);
                }
              }}
            >
              {imageReady ? (
                <SlideCanvas
                  ref={canvasRef}
                  doc={docWithBg}
                  showToolbar={isEditingText}
                  overlayContent={(() => {
                    const showHover = !isPresenting && !isReadOnly && isHovering && !editingSlideId && editingOverlaySlideId !== slide.id;
                    const inOverlayEdit = editingOverlaySlideId === slide.id;
                    if (inOverlayEdit) {
                      return (
                        <>
                          <div className="absolute left-0 right-0 top-0 z-[6] flex justify-center pt-3 pointer-events-none">
                            <div className="flex gap-2 rounded-full bg-black/50 backdrop-blur-md px-2 py-1 pointer-events-auto">
                              <button
                                onClick={() => {
                                  setEditingOverlaySlideId(null);
                                  const { slides, setSlides } = usePresentationState.getState();
                                  const updated = slides.slice();
                                  const i = updated.findIndex((x) => x.id === slide.id);
                                  if (i >= 0) {
                                    const existing = updated[i];
                                    if (!existing) return;
                                    const c = (existing.canvas ?? docWithBg) as CanvasDoc;
                                    updated[i] = { ...existing, canvas: { ...c, selection: [] } };
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
                                  const { slides, setSlides } = usePresentationState.getState();
                                  const updated = slides.slice();
                                  const i = updated.findIndex((x) => x.id === slide.id);
                                  if (i >= 0) {
                                    const cur = updated[i];
                                    if (!cur) return;
                                    const c = (cur.canvas ?? docWithBg) as CanvasDoc;
                                    const nodes = (c.nodes ?? []).filter(
                                      (n: any) => !(n?.type === "image" && n?.id === "user-overlay-image"),
                                    );
                                    updated[i] = { ...cur, canvas: { ...c, nodes, selection: [] } };
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
                           {/* Top Half: Edit Text */}
                           <button
                             onClick={() => {
                               setEditingSlideId(slide.id);
                               setIsHovering(false);
                               // Focus first text element after a short delay
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
                           {/* Bottom Half: Edit Image */}
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
                           {/* Toggle Button */}
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
                    // Remove focus from text
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

                    // 🛡️ SAFETY MERGE: verliere nie Textknoten beim Update
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
                <SlideCanvas
                  doc={docWithBg}
                  showToolbar={isEditingText}
                  overlayContent={
                    !isPresenting &&
                    !isReadOnly &&
                    isHovering &&
                    !editingSlideId ? (
                      <div className="flex flex-col h-full pointer-events-none">
                        {/* Top Half: Edit Text */}
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
                        {/* Bottom Half: Edit Image */}
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
