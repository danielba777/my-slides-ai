"use client";

import { type PlateSlide } from "@/components/presentation/utils/parser";
import { usePresentationState } from "@/states/presentation-state";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { nanoid } from "nanoid";
import { useCallback, useMemo } from "react";

interface SlideWithId extends PlateSlide {
  id: string;
}

export function usePresentationSlides() {
  const slides = usePresentationState((s) => s.slides);
  const setSlides = usePresentationState((s) => s.setSlides);
  const setCurrentSlideIndex = usePresentationState(
    (s) => s.setCurrentSlideIndex,
  );
  const isPresenting = usePresentationState((s) => s.isPresenting);

  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, 
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  
  const items = useMemo(
    () =>
      slides.map((slide) => (slide?.id ? slide : { ...slide, id: nanoid() })),
    [slides],
  );

  
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (isPresenting) return; 

      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex(
          (item: SlideWithId) => item.id === active.id,
        );
        const newIndex = items.findIndex(
          (item: SlideWithId) => item.id === over.id,
        );
        const newArray = arrayMove(items, oldIndex, newIndex);
        setSlides([...newArray]);
        
        setCurrentSlideIndex(newIndex);
      }
    },
    [items, isPresenting, setSlides, setCurrentSlideIndex],
  );

  
  const scrollToSlide = useCallback((index: number) => {
    
    const slideElement = document.querySelector(
      `.slide-wrapper-${index}`,
    ) as HTMLElement | null;

    if (slideElement) {
      
      const scrollContainer = document.querySelector(
        ".presentation-slides",
      ) as HTMLElement | null;

      if (scrollContainer) {
        const slideRect = slideElement.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        
        const offsetLeft =
          slideRect.left - containerRect.left + scrollContainer.scrollLeft - 30;

        scrollContainer.scrollTo({
          left: offsetLeft,
          top: 0,
          behavior: "smooth",
        });

        setTimeout(() => {
          
          const editorElement = slideElement.querySelector(
            "[contenteditable=true]",
          );
          if (editorElement instanceof HTMLElement) {
            editorElement.focus();
          }
        }, 500);
      }
    }
  }, []);

  return {
    items,
    sensors,
    isPresenting,
    handleDragEnd,
    scrollToSlide,
  };
}
