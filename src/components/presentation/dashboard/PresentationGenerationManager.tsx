"use client";

import { generateImageAction } from "@/app/_actions/image/generate";
import { getImageFromUnsplash } from "@/app/_actions/image/unsplash";
import { updatePresentation } from "@/app/_actions/presentation/presentationActions";
import {
  applyBackgroundImageToCanvas,
  ensureSlideCanvas,
} from "@/components/presentation/utils/canvas";
import { extractThinking } from "@/lib/thinking-extractor";
import { getEffectiveSlideCount } from "@/lib/presentation/slide-count";
import { usePresentationState } from "@/states/presentation-state";
import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

export function PresentationGenerationManager() {
  const {
    numSlides,
    slideCountMode,
    language,
    presentationInput,
    shouldStartOutlineGeneration,
    webSearchEnabled,
    modelProvider,
    modelId,
    setIsGeneratingOutline,
    setShouldStartOutlineGeneration,
    setShouldStartPresentationGeneration,
    resetGeneration,
    resetForNewGeneration,
    setOutline,
    setSearchResults,
    setOutlineThinking,
    setCurrentPresentation,
    currentPresentationId,
    imageModel,
    imageSource,
    rootImageGeneration,
    completeRootImageGeneration,
    failRootImageGeneration,
    isGeneratingPresentation,
    isGeneratingOutline,
    slides,
    setSlides,
  } = usePresentationState();

  const outlineRafIdRef = useRef<number | null>(null);
  const outlineBufferRef = useRef<string[] | null>(null);
  const searchResultsBufferRef = useRef<
    Array<{ query: string; results: unknown[] }> | null
  >(null);
  const titleExtractedRef = useRef<boolean>(false);
  const outlineRequestInFlightRef = useRef(false);
  const effectiveSlideCount = useMemo(
    () =>
      getEffectiveSlideCount(slideCountMode, numSlides, presentationInput, {
        fallback: 5,
      }),
    [slideCountMode, numSlides, presentationInput],
  );

  const extractTitle = (
    content: string,
  ): { title: string | null; cleanContent: string } => {
    const titleMatch = content.match(/<TITLE>(.*?)<\/TITLE>/i);
    if (titleMatch?.[1]) {
      const title = titleMatch[1].trim();
      const cleanContent = content.replace(/<TITLE>.*?<\/TITLE>/i, "").trim();
      return { title, cleanContent };
    }
    return { title: null, cleanContent: content };
  };

  const processMessages = (messages: typeof outlineMessages): void => {
    if (messages.length <= 1) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    if (webSearchEnabled && lastMessage.parts) {
      const searchResults: Array<{ query: string; results: unknown[] }> = [];

      for (const part of lastMessage.parts) {
        if (part.type === "tool-invocation" && part.toolInvocation) {
          const invocation = part.toolInvocation;
          if (
            invocation.toolName === "webSearch" &&
            invocation.state === "result" &&
            "result" in invocation &&
            invocation.result
          ) {
            const query =
              typeof invocation.args?.query === "string"
                ? invocation.args.query
                : "Unknown query";

            let parsedResult;
            try {
              parsedResult =
                typeof invocation.result === "string"
                  ? JSON.parse(invocation.result)
                  : invocation.result;
            } catch {
              parsedResult = invocation.result;
            }

            searchResults.push({
              query,
              results: parsedResult?.results || [],
            });
          }
        }
      }

      if (searchResults.length > 0) {
        searchResultsBufferRef.current = searchResults;
      }
    }

    if (lastMessage.role === "assistant" && lastMessage.content) {
      const thinkingExtract = extractThinking(lastMessage.content);
      if (thinkingExtract.hasThinking) {
        setOutlineThinking(thinkingExtract.thinking);
      }

      let cleanContent = thinkingExtract.hasThinking
        ? thinkingExtract.content
        : lastMessage.content;

      if (!titleExtractedRef.current) {
        const { title, cleanContent: extractedCleanContent } =
          extractTitle(cleanContent);

        cleanContent = extractedCleanContent;

        if (title && title.trim().length > 0) {
          setCurrentPresentation(currentPresentationId, title);
        }
        titleExtractedRef.current = true;
      } else {
        cleanContent = cleanContent.replace(/<TITLE>.*?<\/TITLE>/i, "").trim();
      }

      const numberedMatches = Array.from(
        cleanContent.matchAll(/^\s*\d+[\.\)]\s+(.*\S)\s*$/gm),
      )
        .map((match) => match[1]?.trim())
        .filter((value): value is string => Boolean(value && value.length > 0));

      let outlineItems: string[] = [];

      if (numberedMatches.length > 0) {
        outlineItems = numberedMatches;
      } else {
        const sections = cleanContent.split(/^#\s+/gm).filter(Boolean);
        outlineItems =
          sections.length > 0
            ? sections.map((section) => {
                const trimmed = section.trim();
                return trimmed.startsWith("#") ? trimmed : `# ${trimmed}`;
              })
            : [];
      }

      if (outlineItems.length > 0) {
        outlineBufferRef.current = outlineItems;
      }
    }
  };

  const updateOutlineWithRAF = (): void => {
    if (searchResultsBufferRef.current !== null) {
      setSearchResults(searchResultsBufferRef.current);
      searchResultsBufferRef.current = null;
    }

    if (outlineBufferRef.current !== null) {
      setOutline(outlineBufferRef.current);
      outlineBufferRef.current = null;
    }

    outlineRafIdRef.current = null;
  };

  const { messages: outlineMessages, append: appendOutlineMessage } = useChat({
    api: webSearchEnabled
      ? "/api/presentation/outline-with-search"
      : "/api/presentation/outline",
    body: {
      prompt: presentationInput,
      numberOfCards: effectiveSlideCount,
      language,
      modelProvider,
      modelId,
    },
    onFinish: () => {
      setIsGeneratingOutline(false);
      setShouldStartOutlineGeneration(false);
      setShouldStartPresentationGeneration(false);

      const {
        currentPresentationId: presentationId,
        outline,
        searchResults,
        currentPresentationTitle,
        theme,
        imageSource: stateImageSource,
      } = usePresentationState.getState();

      if (presentationId) {
        void updatePresentation({
          id: presentationId,
          outline,
          searchResults,
          prompt: presentationInput,
          title: currentPresentationTitle ?? "",
          theme,
          imageSource: stateImageSource,
        });
      }

      if (outlineRafIdRef.current !== null) {
        cancelAnimationFrame(outlineRafIdRef.current);
        outlineRafIdRef.current = null;
      }
    },
    onError: (error) => {
      toast.error("Failed to generate outline: " + error.message);
      resetGeneration();

      if (outlineRafIdRef.current !== null) {
        cancelAnimationFrame(outlineRafIdRef.current);
        outlineRafIdRef.current = null;
      }
    },
  });

  useEffect(() => {
    if (outlineMessages.length > 1) {
      processMessages(outlineMessages);

      if (outlineRafIdRef.current === null) {
        outlineRafIdRef.current = requestAnimationFrame(updateOutlineWithRAF);
      }
    }
  }, [outlineMessages, webSearchEnabled]);

  useEffect(() => {
    const startOutlineGeneration = async (): Promise<void> => {
      if (!shouldStartOutlineGeneration) return;

      if (outlineRequestInFlightRef.current) {
        return;
      }

      try {
        outlineRequestInFlightRef.current = true;
        resetForNewGeneration();
        titleExtractedRef.current = false;
        setIsGeneratingOutline(true);

        const { presentationInput: currentPrompt } =
          usePresentationState.getState();

        if (outlineRafIdRef.current === null) {
          outlineRafIdRef.current =
            requestAnimationFrame(updateOutlineWithRAF);
        }

        await appendOutlineMessage(
          {
            role: "user",
            content: currentPrompt,
          },
          {
            body: {
              prompt: currentPrompt,
              numberOfCards: effectiveSlideCount,
              language,
            },
          },
        );
      } catch (error) {
        console.error("Outline generation failed:", error);
        toast.error("Unable to start outline generation.");
      } finally {
        outlineRequestInFlightRef.current = false;
        setIsGeneratingOutline(false);
        setShouldStartOutlineGeneration(false);
      }
    };

    void startOutlineGeneration();
  }, [
    shouldStartOutlineGeneration,
    effectiveSlideCount,
    language,
    appendOutlineMessage,
  ]);

  useEffect(() => {
    if (isGeneratingPresentation || isGeneratingOutline) {
      return;
    }

    for (const [slideId, gen] of Object.entries(rootImageGeneration)) {
      if (gen.status !== "pending") continue;

      const slide = slides.find((s) => s.id === slideId);
      const query = slide?.rootImage?.query;
      if (!query) continue;

      void (async () => {
        try {
          let imageUrl: string | undefined;

          if (imageSource === "stock") {
            const unsplash = await getImageFromUnsplash(
              query,
              slide.rootImage?.layoutType,
            );
            if (unsplash.success && unsplash.imageUrl) {
              imageUrl = unsplash.imageUrl;
            }
          } else {
            const generated = await generateImageAction(query, imageModel);
            if (generated?.image?.url) {
              imageUrl = generated.image.url;
            }
          }

          if (!imageUrl) {
            failRootImageGeneration(slideId, "No image url returned");
            return;
          }

          completeRootImageGeneration(slideId, imageUrl);

          const {
            thumbnailUrl,
            currentPresentationId: presentationId,
            setThumbnailUrl,
          } = usePresentationState.getState();

          if (!thumbnailUrl && presentationId) {
            setThumbnailUrl(imageUrl);
            try {
              await updatePresentation({
                id: presentationId,
                thumbnailUrl: imageUrl,
              });
            } catch (thumbnailError) {
              console.warn("Failed to persist thumbnail:", thumbnailError);
            }
          }

          setSlides(
            slides.map((s) =>
              s.id === slideId
                ? ensureSlideCanvas({
                    ...s,
                    rootImage: {
                      ...(s.rootImage ?? { query }),
                      url: imageUrl,
                    },
                    canvas: applyBackgroundImageToCanvas(s.canvas, imageUrl),
                  })
                : s,
            ),
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Image generation failed";
          failRootImageGeneration(slideId, message);
        }
      })();
    }
  }, [
    rootImageGeneration,
    isGeneratingPresentation,
    isGeneratingOutline,
    slides,
    imageSource,
    imageModel,
    completeRootImageGeneration,
    failRootImageGeneration,
    setSlides,
  ]);

  useEffect(() => {
    return () => {
      if (outlineRafIdRef.current !== null) {
        cancelAnimationFrame(outlineRafIdRef.current);
        outlineRafIdRef.current = null;
      }
    };
  }, []);

  return null;
}
