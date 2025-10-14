import { updatePresentation } from "@/app/_actions/presentation/presentationActions";
import { usePresentationState } from "@/states/presentation-state";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef } from "react";

interface UseDebouncedSaveOptions {
  /**
   * Debounce delay in milliseconds
   * @default 1000
   */
  delay?: number;
}

/**
 * Custom hook for debounced saving of presentation slides
 * Automatically saves when slides are changed after the specified delay
 * Will not save while content is being generated
 */
export const useDebouncedSave = (options: UseDebouncedSaveOptions = {}) => {
  const { delay = 1000 } = options;
  const { setSavingStatus } = usePresentationState();

  // Create debounced save function
  const debouncedSave = useRef(
    debounce(
      async () => {
        // Get the latest state directly from the store
        const {
          slides,
          currentPresentationId,
          currentPresentationTitle,
          outline,
          imageSource,
          presentationStyle,
          language,
          config,
          thumbnailUrl,
        } = usePresentationState.getState();

        // Don't save if there's no presentation or slides
        if (!currentPresentationId || slides.length === 0) return;
        try {
          setSavingStatus("saving");

          await updatePresentation({
            id: currentPresentationId,
            content: {
              slides,
              config,
            },
            title: currentPresentationTitle ?? "",
            outline,
            imageSource,
            presentationStyle,
            language,
            thumbnailUrl,
          });

          setSavingStatus("saved");
          // Reset to idle after 2 seconds
          setTimeout(() => {
            setSavingStatus("idle");
          }, 2000);
        } catch (error) {
          console.error("Failed to save presentation:", error);
          setSavingStatus("idle");
        }
      },
      delay,
      { maxWait: delay * 2 },
    ),
  ).current;

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Save slides immediately (useful for manual saves)
  const saveImmediately = useCallback(async () => {
    debouncedSave.cancel();

    // Get the latest state directly from the store
    const {
      slides,
      currentPresentationId,
      currentPresentationTitle,
      outline,
      imageSource,
      presentationStyle,
      language,
      config,
      thumbnailUrl,
    } = usePresentationState.getState();

    // Don't save if there's no presentation
    if (!currentPresentationId || slides.length === 0) return;

    try {
      setSavingStatus("saving");

      await updatePresentation({
        id: currentPresentationId,
        content: {
          slides,
          config,
        },
        title: currentPresentationTitle ?? "",
        outline,
        language,
        imageSource,
        presentationStyle,
        thumbnailUrl,
      });

      setSavingStatus("saved");
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSavingStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Failed to save presentation:", error);
      setSavingStatus("idle");
    }
  }, [debouncedSave, setSavingStatus]);

  // Trigger save function
  const save = useCallback(() => {
    setSavingStatus("saving");
    void debouncedSave();
  }, [debouncedSave, setSavingStatus]);

  return {
    save,
    saveImmediately,
  };
};
