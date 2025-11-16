import { usePresentationState } from "@/states/presentation-state";
import { useEffect } from "react";
import { useDebouncedSave } from "./useDebouncedSave";

interface UseSlideChangeWatcherOptions {
  
  debounceDelay?: number;
}


export const useSlideChangeWatcher = (
  options: UseSlideChangeWatcherOptions = {},
) => {
  const { debounceDelay = 1000 } = options;
  const slides = usePresentationState((s) => s.slides);
  const isGeneratingPresentation = usePresentationState(
    (s) => s.isGeneratingPresentation,
  );
  const { save, saveImmediately } = useDebouncedSave({ delay: debounceDelay });

  
  useEffect(() => {
    
    if (slides.length > 0 && !isGeneratingPresentation) {
      save();
    }
  }, [slides, save, isGeneratingPresentation]);

  return {
    saveImmediately,
  };
};
