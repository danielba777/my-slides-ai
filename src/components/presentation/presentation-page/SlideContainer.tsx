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
        {!isPresenting && (
          <div className="absolute left-4 top-4 z-[100] opacity-0 transition-opacity duration-200 group-hover/card-container:opacity-100">
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/95 px-2 py-1 shadow-lg backdrop-blur">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 cursor-grab rounded-full border border-border/70 text-muted-foreground hover:text-foreground"
                ref={setActivatorNodeRef}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </Button>

              <SlideEditPopover index={index} />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full border border-border/70 text-muted-foreground hover:text-destructive"
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

        {children}
      </div>

      {!isPresenting && !isReadOnly && (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover/card-container:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-border/70 bg-background/95 text-muted-foreground shadow-lg backdrop-blur hover:text-foreground"
            onClick={() => addSlide("before", index)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!isPresenting && !isReadOnly && (
        <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover/card-container:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-border/70 bg-background/95 text-muted-foreground shadow-lg backdrop-blur hover:text-foreground"
            onClick={() => addSlide("after", index)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

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
