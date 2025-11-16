"use client";

import {
  getPresentation,
  updatePresentation,
  updatePresentationTheme,
} from "@/app/_actions/presentation/presentationActions";
import { getCustomThemeById } from "@/app/_actions/presentation/theme-actions";
import { ensureSlidesHaveCanvas } from "@/components/presentation/utils/canvas";
import { type PlateSlide } from "@/components/presentation/utils/parser";
import {
  setThemeVariables,
  type ThemeProperties,
  type Themes,
  themes,
} from "@/lib/presentation/themes";
import { usePresentationState } from "@/states/presentation-state";
import { useQuery } from "@tanstack/react-query";
import debounce from "lodash.debounce";
import { useTheme } from "next-themes";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingState } from "./Loading";
import { PresentationLayout } from "./PresentationLayout";
import { PresentationSlidesView } from "./PresentationSlidesView";

export default function PresentationPage() {
  const params = useParams();
  const id = params.id as string;
  const { resolvedTheme } = useTheme();
  const [shouldFetchData, setSetShouldFetchData] = useState(true);
  const setCurrentPresentation = usePresentationState(
    (s) => s.setCurrentPresentation,
  );
  const setPresentationInput = usePresentationState(
    (s) => s.setPresentationInput,
  );
  const setOutline = usePresentationState((s) => s.setOutline);
  const setSlides = usePresentationState((s) => s.setSlides);
  const setThumbnailUrl = usePresentationState((s) => s.setThumbnailUrl);
  const isGeneratingPresentation = usePresentationState(
    (s) => s.isGeneratingPresentation,
  );
  const setTheme = usePresentationState((s) => s.setTheme);
  const setImageModel = usePresentationState((s) => s.setImageModel);
  const setImageSource = usePresentationState((s) => s.setImageSource);
  const setPresentationStyle = usePresentationState(
    (s) => s.setPresentationStyle,
  );
  const currentSlideIndex = usePresentationState((s) => s.currentSlideIndex);
  const setLanguage = usePresentationState((s) => s.setLanguage);
  const setImageSetId = usePresentationState((s) => s.setImageSetId);
  const theme = usePresentationState((s) => s.theme);
  
  const dbThemeRef = useRef<string | null>(null);

  useEffect(() => {
    if (isGeneratingPresentation) {
      setSetShouldFetchData(false);
    }
  }, [isGeneratingPresentation]);

  useEffect(() => {
    console.log("Current Slide Index", currentSlideIndex);
  }, [currentSlideIndex]);

  
  const { data: presentationData, isLoading } = useQuery({
    queryKey: ["presentation", id],
    queryFn: async () => {
      const result = await getPresentation(id);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to load presentation");
      }
      return result.presentation;
    },
    enabled: !!id && !isGeneratingPresentation && shouldFetchData,
  });

  
  const debouncedThemeUpdate = useCallback(
    debounce((presentationId: string, newTheme: string) => {
      updatePresentationTheme(presentationId, newTheme)
        .then((result) => {
          if (result.success) {
            console.log("Theme updated in database");
          } else {
            console.error("Failed to update theme:", result.message);
          }
        })
        .catch((error) => {
          console.error("Error updating theme:", error);
        });
    }, 600),
    [],
  );

  
  useEffect(() => {
    
    if (isGeneratingPresentation || !shouldFetchData) {
      return;
    }

    if (presentationData) {
      
      dbThemeRef.current = presentationData.presentation?.theme ?? null;
      setCurrentPresentation(presentationData.id, presentationData.title);
      setPresentationInput(
        presentationData.presentation?.prompt ?? presentationData.title,
      );

      
      const presentationContent = presentationData.presentation
        ?.content as unknown as {
        slides: PlateSlide[];
        config: Record<string, unknown>;
      };

      
      setSlides(ensureSlidesHaveCanvas(presentationContent?.slides ?? []));

      
      
      const persistedImageSetId =
        (presentationContent?.config as any)?.imageSetId ?? null;
      if (persistedImageSetId && typeof persistedImageSetId === "string") {
        setImageSetId(persistedImageSetId);
      }

      
      const currentThumb = presentationData.thumbnailUrl;
      if (!currentThumb) {
        const slides = presentationContent?.slides ?? [];
        const deriveFromSlides = (): string | null => {
          if (!Array.isArray(slides) || slides.length === 0) return null;
          const firstRoot = slides[0]?.rootImage?.url;
          if (typeof firstRoot === "string" && firstRoot) return firstRoot;
          for (const s of slides) {
            const u = s?.rootImage?.url;
            if (typeof u === "string" && u) return u;
          }
          const findFirstImgUrl = (nodes: unknown[]): string | null => {
            for (const n of nodes) {
              if (!n || typeof n !== "object") continue;
              const anyNode = n as Record<string, unknown>;
              if (anyNode.type === "img" && typeof anyNode.url === "string") {
                return anyNode.url as string;
              }
              const children = anyNode.children as unknown[] | undefined;
              if (Array.isArray(children)) {
                const found = findFirstImgUrl(children);
                if (found) return found;
              }
            }
            return null;
          };
          for (const s of slides) {
            const nodes = (s as unknown as { content?: unknown[] }).content;
            if (Array.isArray(nodes)) {
              const found = findFirstImgUrl(nodes);
              if (found) return found;
            }
          }
          return null;
        };
        const derived = deriveFromSlides();
        if (derived) {
          setThumbnailUrl(derived);
          void updatePresentation({
            id: presentationData.id,
            thumbnailUrl: derived,
          });
        }
      }

      
      if (presentationContent?.config?.backgroundOverride !== undefined) {
        const { setConfig } = usePresentationState.getState();
        setConfig(presentationContent.config as Record<string, unknown>);
      }

      
      if (presentationData.presentation?.outline) {
        setOutline(presentationData.presentation.outline);
      }

      
      if (presentationData?.presentation?.theme) {
        const themeId = presentationData.presentation.theme;

        
        if (themeId in themes) {
          
          setTheme(themeId as Themes);
        } else {
          
          void getCustomThemeById(themeId)
            .then((result) => {
              if (result.success && result.theme) {
                
                const themeData = result.theme.themeData;
                setTheme(themeId, themeData as unknown as ThemeProperties);
              } else {
                
                console.warn("Custom theme not found:", themeId);
                setTheme("mystique");
              }
            })
            .catch((error) => {
              console.error("Failed to load custom theme:", error);
              
              setTheme("mystique");
            });
        }
      }

      if (presentationData?.presentation?.imageSource) {
        const persistedSource = presentationData.presentation
          .imageSource as string;
        if (
          persistedSource === "ai" ||
          persistedSource === "stock" ||
          persistedSource === "imageset"
        ) {
          setImageSource(persistedSource);
        }
      }

      
      if (presentationData?.presentation?.presentationStyle) {
        setPresentationStyle(presentationData.presentation.presentationStyle);
      }

      
      if (presentationData.presentation?.language) {
        setLanguage(presentationData.presentation.language);
      }
    }
  }, [
    presentationData,
    isGeneratingPresentation,
    shouldFetchData,
    setCurrentPresentation,
    setPresentationInput,
    setOutline,
    setSlides,
    setTheme,
    setImageModel,
    setPresentationStyle,
    setLanguage,
    setImageSetId,
  ]);

  
  useEffect(() => {
    if (!id || isLoading || !theme) return;
    
    if (dbThemeRef.current === null) return;
    
    if (theme === dbThemeRef.current) return;

    
    dbThemeRef.current = theme as string;
    debouncedThemeUpdate(id, theme as string);
  }, [theme, id, debouncedThemeUpdate, isLoading]);

  
  useEffect(() => {
    if (theme && resolvedTheme) {
      const state = usePresentationState.getState();
      
      if (state.customThemeData) {
        setThemeVariables(state.customThemeData, resolvedTheme === "dark");
      }
      
      else if (typeof theme === "string" && theme in themes) {
        const currentTheme = themes[theme as keyof typeof themes];
        if (currentTheme) {
          setThemeVariables(currentTheme, resolvedTheme === "dark");
        }
      }
    }
  }, [theme, resolvedTheme]);

  
  const currentThemeData = (() => {
    const state = usePresentationState.getState();
    if (state.customThemeData) {
      return state.customThemeData;
    }
    if (typeof theme === "string" && theme in themes) {
      return themes[theme as keyof typeof themes];
    }
    return null;
  })();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <PresentationLayout
      isLoading={isLoading}
      themeData={currentThemeData ?? undefined}
      hideSidebar
      fixedBackgroundColor="#F3F4EF"
    >
      <div className="mx-auto w-full max-w-none px-8 pt-16">
        <PresentationSlidesView
          isGeneratingPresentation={isGeneratingPresentation}
        />
      </div>
    </PresentationLayout>
  );
}
