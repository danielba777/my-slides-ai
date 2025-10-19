import { usePresentationState } from "@/states/presentation-state";
import { useEffect } from "react";
import { useDebouncedSave } from "./useDebouncedSave";

interface UseSlideChangeWatcherOptions {
  /**
   * The delay in milliseconds before triggering a save.
   * @default 1000
   */
  debounceDelay?: number;
}

/**
 * A hook that watches for changes to the slides and triggers
 * a debounced save function whenever changes are detected.
 */
export const useSlideChangeWatcher = (
  options: UseSlideChangeWatcherOptions = {},
) => {
  const { debounceDelay = 1000 } = options;
  const slides = usePresentationState((s) => s.slides);
  const isGeneratingPresentation = usePresentationState(
    (s) => s.isGeneratingPresentation,
  );
  const { save, saveImmediately } = useDebouncedSave({ delay: debounceDelay });

  // Watch for changes to the slides array and trigger save
  useEffect(() => {
    // Nur speichern, wenn NICHT generiert wird – verhindert POST-Spam & UI-Flackern
    if (slides.length > 0 && !isGeneratingPresentation) {
      save();
    }
  }, [slides, save, isGeneratingPresentation]);

  return {
    saveImmediately,
  };
};
