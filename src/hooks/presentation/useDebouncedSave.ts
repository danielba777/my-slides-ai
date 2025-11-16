import { updatePresentation } from "@/app/_actions/presentation/presentationActions";
import { usePresentationState } from "@/states/presentation-state";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef } from "react";

interface UseDebouncedSaveOptions {
  
  delay?: number;
}


export const useDebouncedSave = (options: UseDebouncedSaveOptions = {}) => {
  const { delay = 1000 } = options;
  const { setSavingStatus } = usePresentationState();

  
  const debouncedSave = useRef(
    debounce(
      async () => {
        
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

  
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  
  const saveImmediately = useCallback(async () => {
    debouncedSave.cancel();

    
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
      
      setTimeout(() => {
        setSavingStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Failed to save presentation:", error);
      setSavingStatus("idle");
    }
  }, [debouncedSave, setSavingStatus]);

  
  const save = useCallback(() => {
    setSavingStatus("saving");
    void debouncedSave();
  }, [debouncedSave, setSavingStatus]);

  return {
    save,
    saveImmediately,
  };
};
