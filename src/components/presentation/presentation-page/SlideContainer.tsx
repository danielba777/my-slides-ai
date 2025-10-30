"use client";

import { loadImageDecoded } from "@/canvas/konva-helpers";
import type { CanvasDoc } from "@/canvas/types";
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
  const currentSlideIndex = usePresentationState((s) => s.currentSlideIndex);
  const setCurrentSlideIndex = usePresentationState(
    (s) => s.setCurrentSlideIndex,
  );
  // setSlides no longer needed after extracting operations
  // Select only this slide's data so other slides don't re-render on unrelated changes
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
  const setSlides = usePresentationState((s) => s.setSlides);
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
        // Guard: updated[idx] kann noch nicht existieren
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/card-container relative z-10 grid w-full place-items-center pb-6",
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
        {/* Untere Toolbar: unter dem Canvas, horizontal und mittig */}
        {!isPresenting && !isReadOnly && null}

        {/* Hinweis: die früheren schwebenden + Buttons oben/unten wurden entfernt */}

        {children}

        {/* Untere Toolbar unter dem Canvas */}
        {!isPresenting && !isReadOnly && (
          <div
            className={cn("z-[1001] mt-3 w-full")}
            aria-label="Slide toolbar"
          >
            <div className="mx-auto flex w-full max-w-[760px] items-center justify-center gap-2 rounded-md bg-background/95 p-2 shadow-sm backdrop-blur">
              {/* Drag-Handle */}
              <button
                ref={setActivatorNodeRef as React.Ref<HTMLButtonElement>}
                {...listeners}
                {...attributes}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:outline-none"
                aria-label="Drag slide position"
                title="Move"
              >
                <GripVertical className="h-4 w-4" />
              </button>

              {/* Neuer: Persönliche Bilder (ersetzt den Edit/Canvas-Button) */}
              <PersonalImagePickerButton index={index} />

              {/* Neue Folie darunter */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
                onClick={() => addSlide("after", index)}
                aria-label="Add next slide"
                title="Add next slide"
              >
                <Plus className="h-4 w-4" />
              </Button>

              {/* Zufallsbild innerhalb der Kategorie */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
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

              {/* Löschen */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-md text-muted-foreground hover:text-destructive"
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

/**
 * Button + Dialog for personal images:
 * - Opens own menu (same styling/sizes as ImageCollectionSelector)
 * - Tab "Upload" (+ per-account storage), Tab "My Images"
 * - Confirm sets the image centered as rootImage of the current slide
 */
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

    // ➕ Persönliches Bild als Overlay-Node (unter dem Text, über dem BG)
    const slide = updated[index]!;
    const canvas = ensureCanvas(slide.canvas as CanvasDoc | undefined);

    // Entferne evtl. vorhandenes persönliches Bild (1 pro Slide)
    const nodesWithoutOld = canvas.nodes.filter(
      (n: any) => !(n?.type === "image" && n?.id === "user-overlay-image"),
    );

    // Bild NATÜRLICH und ZENTRIERT platzieren (kein Zuschneiden, kein Cover)
    // -> auf natürliche Größe, falls größer als Canvas: proportional auf Canvas einpassen (contain)
    let natW = canvas.width;
    let natH = canvas.height;
    try {
      const img = await loadImageDecoded(imageUrl);
      natW = img.naturalWidth || natW;
      natH = img.naturalHeight || natH;
    } catch {
      // Fallback: halbe Canvasgröße
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
      // 🔒 Explizit jedes Zuschneiden deaktivieren
      cropX: 0,
      cropY: 0,
      cropWidth: natW,
      cropHeight: natH,
      fit: "contain",            // falls der Renderer eine Fit-Strategie kennt
      preserveAspectRatio: true, // klarstellen, dass nichts verzerrt/cropped wird
      clipToCanvas: false,       // falls es eine Canvas-Clip-Option gibt → aus
      mask: false,               // falls Masking im Renderer existiert → aus
    };

    const nextCanvas: CanvasDoc = {
      ...canvas,
      nodes: [...nodesWithoutOld, personalNode],
      // direkt vorselektieren, damit Drag/Zoom sofort funktioniert
      selection: ["user-overlay-image"],
    };

    updated[index] = { ...slide, canvas: nextCanvas };
    setSlides(updated);
    setOpen(false);
  };

  // --- Verhindere Seiten-Scrollen beim Zoomen/Edithieren des Overlay-Bildes ---
  // Wenn das persönliche Overlay-Bild ausgewählt ist, unterbinden wir global das Wheel-Scrollen,
  // damit nur das Canvas-Zoomen/Transformieren greift.
  useEffect(() => {
    const sel = (slides[index]?.canvas as CanvasDoc | undefined)?.selection ?? [];
    const overlaySelected = sel.includes("user-overlay-image");
    if (!overlaySelected) return;
    const onWheel = (e: WheelEvent) => {
      // wichtig: passive:false nötig, darum preventDefault hier möglich
      e.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel as any, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Statt Dialog: in den Editmodus wechseln
      const ensured = ensureCanvas(c);
      const next: CanvasDoc = { ...ensured, selection: ["user-overlay-image"] };
      const updated = slides.slice();
      updated[index] = { ...slide, canvas: next };
      setSlides(updated);
      setEditingOverlaySlideId(slide.id);
      return;
    }
    // Sonst Dialog öffnen
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
        onClick={onMainButtonClick}
        aria-label="Personal Images"
        title="Personal Images"
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
