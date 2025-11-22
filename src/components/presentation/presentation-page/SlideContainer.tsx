"use client";

import { loadImageDecoded } from "@/canvas/konva-helpers";
import type { CanvasDoc } from "@/canvas/types";
import { OutlineIcon } from "@/components/icons/OutlineIcon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSlideOperations } from "@/hooks/presentation/useSlideOperations";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowRight,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import PersonalImageSelectorDialog from "./PersonalImageSelectorDialog";

const ACTION_BUTTON_CLASSES =
  "inline-flex !h-11 !w-11 !p-0 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-md ring-1 ring-black/5 transition-colors hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-white/10 dark:text-white/80 dark:ring-white/20";

interface SlideContainerProps {
  children: React.ReactNode;
  index: number;
  id: string;
  className?: string;
  isReadOnly?: boolean;
  slideWidth?: string;
  slidesCount?: number;
}

export function SlideContainer({
  children,
  index,
  id,
  className,
  isReadOnly = false,
  slideWidth,
  slidesCount,
}: SlideContainerProps) {
  const isPresenting = usePresentationState((s) => s.isPresenting);
  const editingSlideId = usePresentationState((s) => s.editingSlideId);
  const currentSlideIndex = usePresentationState((s) => s.currentSlideIndex);
  const setCurrentSlideIndex = usePresentationState(
    (s) => s.setCurrentSlideIndex,
  );
  const slides = usePresentationState((s) => s.slides);
  const setSlides = usePresentationState((s) => s.setSlides);

  const currentSlide = usePresentationState((s) => s.slides[index]);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: isPresenting || isReadOnly,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [dragTransparent, setDragTransparent] = React.useState(false);

  useEffect(() => {
    if (isDragging) {
      const timeout = setTimeout(() => {
        setDragTransparent(true);
      }, 200);
      return () => clearTimeout(timeout);
    } else {
      setDragTransparent(false);
    }
  }, [isDragging]);

  const { addSlide, deleteSlideAt } = useSlideOperations();
  const presentationImageSetId = usePresentationState((s) => s.imageSetId);
  const [isShuffling, setIsShuffling] = useState(false);
  const activeImageSetId =
    currentSlide?.rootImage?.imageSetId ?? presentationImageSetId ?? null;
  const canShuffle = Boolean(activeImageSetId);

  const deleteSlide = () => {
    deleteSlideAt(index);
  };

  const handleShuffleImage = async () => {
    const imageSetId = activeImageSetId;
    if (!imageSetId || isShuffling) return;

    setIsShuffling(true);
    try {
      const response = await fetch(
        `/api/imagesets/${imageSetId}/random-image`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch random image");
      }
      const data = await response.json();
      const nextUrl =
        data?.imageUrl ??
        data?.url ??
        data?.image?.url ??
        (Array.isArray(data?.images) ? data.images[0]?.url : undefined);
      if (!nextUrl) {
        throw new Error("Missing image URL");
      }
      const state = usePresentationState.getState();
      const updated = state.slides.slice();
      const idx = updated.findIndex((slideItem) => slideItem.id === id);
      if (idx >= 0) {
        const prevRoot = updated[idx]?.rootImage ?? { query: "" };
        updated[idx] = {
          ...(updated[idx] as any),
          rootImage: {
            query: prevRoot.query,
            url: nextUrl,
            useGrid: false,
            gridImages: undefined,
            imageSetId,
          },
        } as any;
        setSlides(updated);
      }
    } catch (error) {
      console.error("Failed to fetch random image", error);
    } finally {
      setIsShuffling(false);
    }
  };

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
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/card-container relative z-10 grid w-full place-items-center",
        isDragging && "z-50 opacity-50",
        dragTransparent && "opacity-30",
        isPresenting && "fixed inset-0 pb-0",
        index === currentSlideIndex && isPresenting && "z-[999]",
      )}
      {...attributes}
    >
      <div
        className={cn(
          "relative w-full",
          !isPresenting &&
            (slideWidth ?? currentSlide?.width ?? "M") === "S" &&
            "max-w-4xl",
          !isPresenting &&
            (slideWidth ?? currentSlide?.width ?? "M") === "M" &&
            "max-w-5xl",
          !isPresenting &&
            (slideWidth ?? currentSlide?.width ?? "M") === "L" &&
            "max-w-6xl",
          isPresenting && "h-full w-full",
          className,
        )}
      >
        {}
        {!isPresenting && !isReadOnly && null}

        {}

        <div className="relative">
          {children}
          {index !== currentSlideIndex && !isPresenting && (
            <div
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={(e) => {
                if (editingSlideId) return;
                e.stopPropagation();
                setCurrentSlideIndex(index);
              }}
            />
          )}
        </div>

        {}
        {!isPresenting && !isReadOnly && index === currentSlideIndex && (
          <div
            className={cn("z-[1001] mt-1 w-full")}
            aria-label="Slide toolbar"
          >
            <div className="mx-auto flex w-full max-w-[760px] flex-wrap items-center justify-center gap-3 py-3">
              {}
              <button
                ref={setActivatorNodeRef as React.Ref<HTMLButtonElement>}
                {...listeners}
                {...attributes}
                className={cn("text-muted-foreground", ACTION_BUTTON_CLASSES)}
                aria-label="Drag slide position"
                title="Move"
              >
                <GripVertical className="h-4 w-4" />
              </button>

              <Button
                variant="ghost"
                size="icon"
                className={ACTION_BUTTON_CLASSES}
                onClick={toggleOutline}
                aria-label="Toggle Outline"
                title="Toggle Outline"
              >
                <OutlineIcon className="h-4 w-4" />
              </Button>

              {}
              <PersonalImagePickerButton index={index} />

              {}
              <Button
                variant="ghost"
                size="icon"
                className={ACTION_BUTTON_CLASSES}
                onClick={() => addSlide("after", index)}
                aria-label="Add next slide"
                title="Add next slide"
              >
                <Plus className="h-4 w-4" />
              </Button>

              {}
              <Button
                variant="ghost"
                size="icon"
                className={ACTION_BUTTON_CLASSES}
                onClick={handleShuffleImage}
                aria-label="Next image in category"
                title={
                  canShuffle
                    ? "Random image from current category"
                    : "Select an image category first"
                }
                disabled={!canShuffle || isShuffling}
              >
                {isShuffling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>

              {}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      ACTION_BUTTON_CLASSES,
                      "hover:text-destructive focus-visible:ring-destructive",
                    )}
                    aria-label="Delete slide"
                    title="Delete slide"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Slide</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete slide {index + 1}? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button variant="destructive" onClick={deleteSlide}>
                        Delete
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>

      {isPresenting && (
        <div className="absolute bottom-0.5 left-1 right-1 z-[1001]">
          <div className="flex h-1.5 w-full gap-1">
            {Array.from({ length: slidesCount ?? 0 }).map((_, index) => (
              <button
                key={index}
                className={`h-full flex-1 rounded-full transition-all ${
                  index === currentSlideIndex
                    ? "bg-primary shadow-sm"
                    : "bg-white/20 hover:bg-white/40"
                }`}
                onClick={() => setCurrentSlideIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonalImagePickerButton({ index }: { index: number }) {
  const [open, setOpen] = useState(false);
  const slides = usePresentationState((s) => s.slides);
  const setSlides = usePresentationState((s) => s.setSlides);
  const setEditingOverlaySlideId = usePresentationState(
    (s) => s.setEditingOverlaySlideId,
  );

  const ensureCanvas = (c?: CanvasDoc | null): CanvasDoc => {
    return {
      version: c?.version ?? 1,
      width: c?.width ?? 1080,
      height: c?.height ?? 1620,
      bg: c?.bg ?? "#ffffff",
      nodes: Array.isArray(c?.nodes) ? [...c!.nodes] : [],
      selection: Array.isArray(c?.selection)
        ? [...(c!.selection as any[])]
        : [],
      previewDataUrl: c?.previewDataUrl,
    };
  };

  const handleConfirm = async (imageUrl: string) => {
    const updated = slides.slice();
    if (!updated[index]) return;

    const slide = updated[index]!;
    const canvas = ensureCanvas(slide.canvas as CanvasDoc | undefined);

    const nodesWithoutOld = canvas.nodes.filter(
      (n: any) => !(n?.type === "image" && n?.id === "user-overlay-image"),
    );

    let natW = canvas.width;
    let natH = canvas.height;
    try {
      const img = await loadImageDecoded(imageUrl);
      natW = img.naturalWidth || natW;
      natH = img.naturalHeight || natH;
    } catch {
      natW = Math.round(canvas.width * 0.5);
      natH = Math.round(canvas.height * 0.5);
    }
    const scale = Math.min(1, canvas.width / natW, canvas.height / natH);
    const finalW = Math.round(natW * scale);
    const finalH = Math.round(natH * scale);
    const centeredX = Math.round((canvas.width - finalW) / 2);
    const centeredY = Math.round((canvas.height - finalH) / 2);

    const personalNode = {
      id: "user-overlay-image",
      type: "image" as const,
      x: centeredX,
      y: centeredY,
      width: finalW,
      height: finalH,
      url: imageUrl,

      cropX: 0,
      cropY: 0,
      cropWidth: natW,
      cropHeight: natH,
      fit: "contain",
      preserveAspectRatio: true,
      clipToCanvas: false,
      mask: false,
    };

    const nextCanvas: CanvasDoc = {
      ...canvas,
      nodes: [...nodesWithoutOld, personalNode],

      selection: ["user-overlay-image"],
    };

    updated[index] = { ...slide, canvas: nextCanvas };
    setSlides(updated);
    setOpen(false);
  };

  useEffect(() => {
    const sel =
      (slides[index]?.canvas as CanvasDoc | undefined)?.selection ?? [];
    const overlaySelected = sel.includes("user-overlay-image");
    if (!overlaySelected) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel as any, false);
  }, [(slides[index]?.canvas as any)?.selection]);

  const onMainButtonClick = () => {
    const slide = slides[index];
    if (!slide) return;
    const c = slide.canvas as CanvasDoc | undefined;
    const hasPersonal =
      Array.isArray(c?.nodes) &&
      c!.nodes.some(
        (n: any) => n?.type === "image" && n?.id === "user-overlay-image",
      );

    if (hasPersonal) {
      const ensured = ensureCanvas(c);
      const next: CanvasDoc = { ...ensured, selection: ["user-overlay-image"] };
      const updated = slides.slice();
      updated[index] = { ...slide, canvas: next };
      setSlides(updated);
      setEditingOverlaySlideId(slide.id);
      return;
    }

    setOpen(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={ACTION_BUTTON_CLASSES}
        onClick={onMainButtonClick}
        aria-label="Overlay Image"
        title="Overlay Image"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <PersonalImageSelectorDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
      />
    </>
  );
}
