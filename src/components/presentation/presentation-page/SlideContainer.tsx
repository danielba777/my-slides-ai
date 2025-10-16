"use client";

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
import { GripVertical, Plus, Trash } from "lucide-react";
import React, { useEffect } from "react";
import { SlideEditPopover } from "./SlideEditPopover";

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

  const deleteSlide = () => {
    deleteSlideAt(index);
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
        {/* Linke, vertikale Toolbar (immer sichtbar, stört nicht den Editor) */}
        {!isPresenting && !isReadOnly && (
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -left-14 z-[1001]",
            )}
            aria-label="Slide toolbar"
          >
            <div className="flex flex-col items-center gap-2">
              {/* Drag-Handle */}
              <button
                ref={setActivatorNodeRef as React.Ref<HTMLButtonElement>}
                {...listeners}
                {...attributes}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-background/95 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground focus:outline-none focus-visible:outline-none"
                aria-label="Folienposition ziehen"
                title="Verschieben"
              >
                <GripVertical className="h-4 w-4" />
              </button>

              {/* Slide-Einstellungen */}
              <div className="rounded-md bg-background/95 shadow-sm backdrop-blur">
                <SlideEditPopover index={index} />
              </div>

              {/* Neues Canvas unter aktueller Folie */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md bg-background/95 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground focus:outline-none focus-visible:outline-none"
                onClick={() => addSlide("after", index)}
                aria-label="Neue Folie darunter"
                title="Neue Folie darunter"
              >
                <Plus className="h-4 w-4" />
              </Button>

              {/* Löschen */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-md bg-background/95 text-muted-foreground shadow-sm backdrop-blur hover:text-destructive focus:outline-none focus-visible:outline-none"
                    aria-label="Folie löschen"
                    title="Folie löschen"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Slide</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete slide {index + 1}? This action cannot be undone.
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

        {/* Hinweis: die früheren schwebenden + Buttons oben/unten wurden entfernt */}

        {children}
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
