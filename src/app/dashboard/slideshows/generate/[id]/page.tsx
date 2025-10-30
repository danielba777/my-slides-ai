"use client";

import { generateImageAction } from "@/app/_actions/image/generate";
import { getImageFromUnsplash } from "@/app/_actions/image/unsplash";
import {
  getPresentation,
  updatePresentation,
} from "@/app/_actions/presentation/presentationActions";
import { getCustomThemeById } from "@/app/_actions/presentation/theme-actions";
import { type CanvasDoc, type CanvasTextNode } from "@/canvas/types";
import { LoadingState } from "@/components/presentation/presentation-page/Loading";
import { applyBackgroundImageToCanvas } from "@/components/presentation/utils/canvas";
import {
  type PlateNode,
  type PlateSlide,
} from "@/components/presentation/utils/parser";
import {
  themes,
  type ThemeProperties,
  type Themes,
} from "@/lib/presentation/themes";
import { usePresentationState } from "@/states/presentation-state";
import { useQuery } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

// Nicht exportieren, sonst verletzt es die erlaubten Next.js App-Exports
// und triggert den TS2344-Fehler (.next/types/... checkFields).
const PRESENTATION_GENERATION_COOKIE = "presentation_generation_pending";

function hasPendingCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${PRESENTATION_GENERATION_COOKIE}=`));
}

function clearPendingCookie() {
  if (typeof document === "undefined") return;
  const domain =
    window.location.hostname === "localhost" ? "localhost" : ".allweone.com";
  document.cookie = `${PRESENTATION_GENERATION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; ${
    domain !== "localhost" ? `domain=${domain}; ` : ""
  }SameSite=Lax`;
}

function makeCanvasFromText(text: string, w = 1080, h = 1620): CanvasDoc {
  // 2:3 aspect ratio
  const nx = 0.5;
  const ny = 0.5;
  return {
    version: 1,
    width: w,
    height: h,
    bg: "#ffffff",
    nodes: [
      {
        id: nanoid(),
        type: "text",
        x: Math.round(nx * w),
        y: Math.round(ny * h),
        nx, // Horizontal mittig (normalisierte Koordinaten)
        ny, // Vertikal mittig (normalisierte Koordinaten)
        text,
        fontFamily: "Inter",
        fontSize: 72,
        fill: "#111",
      },
    ],
    selection: [],
  };
}

export default function PresentationGenerateWithIdPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const {
    setCurrentPresentation,
    setPresentationInput,
    isGeneratingPresentation,
    isGeneratingOutline,
    setOutline,
    setSearchResults,
    setShouldStartOutlineGeneration,
    setTheme,
    setImageSource,
    setPresentationStyle,
    setLanguage,
    setWebSearchEnabled,
    outline,
  } = usePresentationState();

  // Track if this is a fresh navigation or a revisit
  const initialLoadComplete = useRef(false);
  const generationStarted = useRef(false);
  const slidesGenerationTriggered = useRef(false);

  // Use React Query to fetch presentation data
  const { data: presentationData, isLoading: isLoadingPresentation } = useQuery(
    {
      queryKey: ["presentation", id],
      queryFn: async () => {
        const result = await getPresentation(id);
        if (!result.success) {
          throw new Error(result.message ?? "Failed to load presentation");
        }
        return result.presentation;
      },
      enabled: !!id,
    },
  );

  // Function to clear the cookie
  const clearPresentationCookie = () => {
    if (typeof document === "undefined") return;

    const domain =
      window.location.hostname === "localhost" ? "localhost" : ".allweone.com";

    document.cookie = `${PRESENTATION_GENERATION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; ${domain !== "localhost" ? `domain=${domain}; ` : ""}`;
  };

  // Clear legacy cookie name if vorhanden (Abwärtskompatibilität)
  useEffect(() => {
    // früherer Name beibehalten:
    clearPresentationCookie();
  }, []);

  // This effect handles the immediate startup of generation upon first mount
  // only if we're coming fresh from the dashboard (isGeneratingOutline === true)
  useEffect(() => {
    // Only run once on initial page load
    if (initialLoadComplete.current) return;
    initialLoadComplete.current = true;

    // Start, wenn Store-Flag ODER Pending-Cookie gesetzt ist
    if (
      (isGeneratingOutline || hasPendingCookie()) &&
      !generationStarted.current
    ) {
      console.log("Starting outline generation after navigation");
      generationStarted.current = true;

      // Give the component time to fully mount and establish connections
      // before starting the generation process
      setTimeout(() => {
        setShouldStartOutlineGeneration(true);
        // Cookie ist verbraucht
        clearPendingCookie();
      }, 100);
    }
  }, [isGeneratingOutline, setShouldStartOutlineGeneration]);

  /**
   * Sobald die Outline fertig ist, direkt die Slides generieren
   * und auf die Slides-Page weiterleiten — ohne dass die Outline-Seite sichtbar wird.
   */
  useEffect(() => {
    if (slidesGenerationTriggered.current) return;
    const outlineReady =
      !isGeneratingOutline && Array.isArray(outline) && outline.length > 0;
    if (outlineReady && !isGeneratingPresentation) {
      slidesGenerationTriggered.current = true;
      void handleGenerate();
    }
  }, [outline, isGeneratingOutline, isGeneratingPresentation]);

  // Update presentation state when data is fetched
  useEffect(() => {
    if (presentationData && !isLoadingPresentation && !isGeneratingOutline) {
      setCurrentPresentation(presentationData.id, presentationData.title);
      setPresentationInput(
        presentationData.presentation?.prompt ?? presentationData.title,
      );

      if (presentationData.presentation?.outline) {
        setOutline(presentationData.presentation.outline);
      }

      // Load search results if available
      if (presentationData.presentation?.searchResults) {
        try {
          const searchResults = Array.isArray(
            presentationData.presentation.searchResults,
          )
            ? presentationData.presentation.searchResults
            : JSON.parse(presentationData.presentation.searchResults as string);
          setWebSearchEnabled(true);
          setSearchResults(searchResults);
        } catch (error) {
          console.error("Failed to parse search results:", error);
          setSearchResults([]);
        }
      }

      // Set theme if available
      if (presentationData.presentation?.theme) {
        const themeId = presentationData.presentation.theme;

        // Check if this is a predefined theme
        if (themeId in themes) {
          // Use predefined theme
          setTheme(themeId as Themes);
        } else {
          // If not in predefined themes, treat as custom theme
          void getCustomThemeById(themeId)
            .then((result) => {
              if (result.success && result.theme) {
                // Set the theme with the custom theme data
                const themeData = result.theme
                  .themeData as unknown as ThemeProperties;
                setTheme(themeId, themeData);
              } else {
                // Fallback to default theme if custom theme not found
                console.warn("Custom theme not found:", themeId);
                setTheme("mystique");
              }
            })
            .catch((error) => {
              console.error("Failed to load custom theme:", error);
              // Fallback to default theme on error
              setTheme("mystique");
            });
        }
      }

      // Set presentationStyle if available
      if (presentationData.presentation?.presentationStyle) {
        setPresentationStyle(presentationData.presentation.presentationStyle);
      }

      if (presentationData.presentation?.imageSource) {
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

      // Set language if available
      if (presentationData.presentation?.language) {
        setLanguage(presentationData.presentation.language);
      }
    }
  }, [
    presentationData,
    isLoadingPresentation,
    setCurrentPresentation,
    setPresentationInput,
    setOutline,
    setTheme,
    setImageSource,
    setPresentationStyle,
    setLanguage,
  ]);

  const getImageForSlide = async (
    query: string,
    state: ReturnType<typeof usePresentationState.getState>,
  ): Promise<string | undefined> => {
    if (!query) {
      return undefined;
    }

    if (state.imageSource === "imageset" && state.imageSetId) {
      try {
        const response = await fetch(
          `/api/imagesets/${state.imageSetId}/random-image`,
        );
        if (response.ok) {
          const result = await response.json();
          if (result?.success && result.imageUrl) {
            return result.imageUrl as string;
          }
        }
      } catch (error) {
        console.error("Imageset image lookup failed:", error);
      }
    }

    if (state.imageSource === "stock") {
      try {
        const imageResult = await getImageFromUnsplash(query);
        if (imageResult.success && imageResult.imageUrl) {
          return imageResult.imageUrl;
        }
      } catch (error) {
        console.error("Unsplash image lookup failed:", error);
      }
    } else if (state.imageSource === "ai") {
      try {
        const aiResult = await generateImageAction(query, state.imageModel);
        if (aiResult?.image?.url) {
          return aiResult.image.url;
        }
      } catch (error) {
        console.error("AI image generation failed:", error);
      }
    }

    return undefined;
  };

  const handleGenerate = async () => {
    const state = usePresentationState.getState();
    if (state.isGeneratingPresentation) return;

    if (!state.outline || state.outline.length === 0) {
      toast.error("Outline is empty. Please add at least one slide.");
      return;
    }

    state.setIsGeneratingPresentation(true);
    state.setPresentationThinking("");
    state.setShouldStartPresentationGeneration(false);

    // Canvas-only: jedes Outline-Item wird ein Canvas-Slide
    const chosenWidth = 1080; // TODO: aus Preset/Wizard holen
    const chosenHeight = 1920; // TODO: aus Preset/Wizard holen

    const slides: PlateSlide[] = await Promise.all(
      state.outline.map(async (item) => {
        const normalized = item.replace(/^#\s+/, "").trim();
        const canvasDoc = makeCanvasFromText(
          normalized,
          chosenWidth,
          chosenHeight,
        );
        const firstTextNode = canvasDoc.nodes.find(
          (node) => node.type === "text",
        ) as CanvasTextNode | undefined;

        const paragraph = {
          type: "p",
          children: [{ text: normalized }],
        } as unknown as PlateNode;

        const query = normalized.split(/\s+/).slice(0, 10).join(" ");
        const imageUrl = query
          ? await getImageForSlide(query, state)
          : undefined;

        const canvasWithBg = imageUrl
          ? applyBackgroundImageToCanvas(canvasDoc, imageUrl)
          : canvasDoc;

        return {
          id: nanoid(),
          content: [paragraph],
          bgColor: canvasWithBg.bg ?? undefined,
          position: firstTextNode
            ? { x: firstTextNode.x, y: firstTextNode.y }
            : undefined,
          canvas: canvasWithBg,
          rootImage: query
            ? {
                query,
                url: imageUrl,
                layoutType: "background",
              }
            : undefined,
        };
      }),
    );

    state.setSlides(slides);
    const firstSlideWithImage = slides.find((slide) => slide.rootImage?.url);
    if (firstSlideWithImage?.rootImage?.url) {
      state.setThumbnailUrl(firstSlideWithImage.rootImage.url);
    }

    const presentationTitle = state.currentPresentationTitle?.trim().length
      ? state.currentPresentationTitle
      : state.presentationInput?.trim().length
        ? state.presentationInput
        : "Untitled Presentation";

    try {
      await updatePresentation({
        id,
        content: { slides, config: state.config ?? {} },
        outline: state.outline,
        prompt: state.presentationInput,
        title: presentationTitle,
        theme: state.theme,
        imageSource: state.imageSource,
        presentationStyle: state.presentationStyle,
        language: state.language,
        searchResults: state.searchResults,
        thumbnailUrl: firstSlideWithImage?.rootImage?.url,
      });
    } catch (error) {
      console.error("Failed to store presentation slides:", error);
      toast.error("Slides saved locally, but storing them failed.");
    } finally {
      state.setIsGeneratingPresentation(false);
      router.push(`/dashboard/slideshows/${id}`);
    }
  };

  // Immer Ladezustand anzeigen, während automatisch generiert wird
  if (isLoadingPresentation) return <LoadingState />;
  return <LoadingState />;
}
