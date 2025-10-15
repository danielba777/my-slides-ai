"use client";

import { Editor } from "@/components/plate/ui/editor";
import debounce from "lodash.debounce";
import { type Value } from "platejs";
import { Plate } from "platejs/react";
import React, { useCallback, useEffect, useState } from "react";
import type { PlateNode } from "../utils/parser";

import { usePlateEditor } from "@/components/plate/hooks/usePlateEditor";
import { TooltipProvider } from "@/components/plate/ui/tooltip";
import { extractFontsFromEditor } from "@/components/plate/utils/extractFontsFromEditor";
import { FontLoader } from "@/components/plate/utils/font-loader";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import "@/styles/presentation.css";
import { type TElement } from "platejs";
import { type PlateSlide } from "../utils/parser";
import ImageGenerationModel from "./custom-elements/image-generation-model";
import RootImage from "./custom-elements/root-image";
import LayoutImageDrop from "./dnd/components/LayoutImageDrop";
import { presentationPlugins } from "./plugins";
import PresentationEditorStaticView from "./presentation-editor-static";
// Canvas (Polotno-like)
import SlideCanvas from "@/canvas/SlideCanvas";
import type { CanvasDoc } from "@/canvas/types";

function slideSignature(slide?: PlateSlide): string {
  try {
    return JSON.stringify({
      id: slide?.id,
      content: slide?.content,
      alignment: slide?.alignment,
      layoutType: slide?.layoutType,
      width: slide?.width,
      rootImage: slide?.rootImage,
      bgColor: slide?.bgColor,
    });
  } catch {
    return String(slide?.id ?? "");
  }
}
interface PresentationEditorProps {
  initialContent?: PlateSlide & { canvas?: CanvasDoc | null };
  className?: string;
  id?: string;
  autoFocus?: boolean;
  slideIndex: number;
  isGenerating: boolean;
  readOnly?: boolean;
  isPreview?: boolean;
}
// Use React.memo with a custom comparison function to prevent unnecessary re-renders
const PresentationEditor = React.memo(
  ({
    initialContent,
    className,
    id,
    autoFocus = true,
    slideIndex,
    isGenerating = false,
    readOnly = false,
    isPreview = false,
  }: PresentationEditorProps) => {
    const isPresenting = usePresentationState((s) => s.isPresenting);
    const setCurrentSlideIndex = usePresentationState(
      (s) => s.setCurrentSlideIndex,
    );
    // ✅ Immer gültiges Array als Fallback übergeben
    const DEFAULT_VALUE: PlateNode[] = [
      { type: "p", children: [{ text: "" }] },
    ];

    // ⚠️ WICHTIG: ID setzen, damit überall derselbe Editor-Store verwendet wird
    const editor = usePlateEditor({
      id: "presentation",
      plugins: presentationPlugins,
      value:
        (initialContent?.content as Value) ??
        (DEFAULT_VALUE as unknown as Value),
    });
    const [fontsToLoad, setFontsToLoad] = useState<string[]>([]);

    useEffect(() => {
      if (!initialContent) return;
      const next = Array.isArray(initialContent.content)
        ? initialContent.content
        : [{ type: "p", children: [{ text: "" }] }];
      requestAnimationFrame(() => {
        editor.tf.setValue(next);
      });
    }, []);

    useEffect(() => {
      if (!isGenerating) return;
      const next = Array.isArray(initialContent?.content)
        ? initialContent!.content
        : [{ type: "p", children: [{ text: "" }] }];
      requestAnimationFrame(() => {
        editor.tf.setValue(next);
      });
    }, [initialContent, isGenerating]);

    const handleSlideChange = useCallback(
      (value: Value, slideIndex: number) => {
        const { slides, setSlides } = usePresentationState.getState();
        const updatedSlides = [...slides];
        // Make sure we have the slide at that index
        if (updatedSlides[slideIndex]) {
          // Update the content of the slide
          updatedSlides[slideIndex] = {
            ...updatedSlides[slideIndex],
            content: value as PlateNode[],
          };

          // Update the global state
          setSlides(updatedSlides);
        }
      },
      [],
    );

    const debouncedOnChange = debounce(
      (value: Value, index: number) => {
        if (isGenerating) return;
        const fontsArray = extractFontsFromEditor(editor);
        setFontsToLoad(fontsArray);
        handleSlideChange(value, index);
      },
      100,
      { maxWait: 200 },
    );

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        debouncedOnChange.cancel();
      };
    }, [debouncedOnChange]);

    const hasRootImage = Boolean(initialContent?.rootImage);
    const editorPaddingClass =
      hasRootImage || readOnly || isGenerating ? "px-16" : undefined;

    // === Canvas-Variante (Polotno-like) ===
    // Wenn das Slide bereits ein CanvasDoc hat, rendere SlideCanvas (frei verschieb-/skalierbar).
    if (initialContent?.canvas) {
      return (
        <TooltipProvider>
          <div
            className={cn(
              "relative flex min-h-[500px]",
              "scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 overflow-hidden p-0 scrollbar-thin scrollbar-track-transparent",
              "relative text-foreground",
              "focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50",
              className,
              !initialContent?.rootImage &&
                initialContent?.layoutType === "right" &&
                "flex-row",
              !initialContent?.rootImage &&
                initialContent?.layoutType === "vertical" &&
                "flex-col-reverse",
              !initialContent?.rootImage &&
                initialContent?.layoutType === "left" &&
                "flex-row-reverse",
              "presentation-slide",
            )}
            style={{
              borderRadius: "var(--presentation-border-radius, 0.5rem)",
              backgroundColor: initialContent?.bgColor || undefined,
            }}
            data-is-presenting={readOnly && isPresenting ? "true" : "false"}
            data-slide-content="true"
          >
            {/* Canvas */}
            <SlideCanvas
              value={initialContent.canvas as CanvasDoc}
              onChange={(next: CanvasDoc) => {
                // Slides im globalen State aktualisieren (inkl. optionalem Preview)
                const { slides, setSlides } = usePresentationState.getState();
                const updated = [...slides];
                if (updated[slideIndex]) {
                  updated[slideIndex] = {
                    ...updated[slideIndex],
                    canvas: {
                      ...next,
                      // optional: aktualisiertes Snapshot-Bild für Sidebar
                      previewDataUrl:
                        next.previewDataUrl ??
                        updated[slideIndex]?.canvas?.previewDataUrl,
                    },
                  };
                  setSlides(updated);
                }
              }}
            />
          </div>
        </TooltipProvider>
      );
    }

    // === Fallback: Plate-Editor (nur wenn noch kein CanvasDoc existiert) ===
    return (
      <TooltipProvider>
        <div
          className={cn(
            "relative flex min-h-[500px]",
            "scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 overflow-hidden p-0 scrollbar-thin scrollbar-track-transparent",
            "relative text-foreground",
            "focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50",
            className,
            !hasRootImage &&
              initialContent?.layoutType === "right" &&
              "flex-row",
            !hasRootImage &&
              initialContent?.layoutType === "vertical" &&
              "flex-col-reverse",
            !hasRootImage &&
              initialContent?.layoutType === "left" &&
              "flex-row-reverse",
            "presentation-slide",
          )}
          style={{
            borderRadius: "var(--presentation-border-radius, 0.5rem)",
            backgroundColor: initialContent?.bgColor || undefined,
          }}
          data-is-presenting={readOnly && isPresenting ? "true" : "false"}
          data-slide-content="true"
        >
          <FontLoader fontsToLoad={fontsToLoad} />

          {isGenerating ? (
            <PresentationEditorStaticView
              initialContent={initialContent}
              className={className}
              id={id}
            />
          ) : (
            <Plate
              editor={editor}
              onValueChange={({ value }) => {
                if (readOnly || isGenerating || isPresenting) return;

                debouncedOnChange(value, slideIndex);
              }}
              readOnly={isGenerating || readOnly}
            >
              {/* Insert from palette via state */}
              <PaletteInsertionListener />
              {!readOnly && (
                <LayoutImageDrop slideIndex={slideIndex}></LayoutImageDrop>
              )}
              <div className="relative flex h-full w-full">
                {initialContent?.rootImage && (
                  <RootImage
                    image={initialContent.rootImage}
                    slideIndex={slideIndex}
                    layoutType={initialContent.layoutType}
                    slideId={initialContent.id}
                  />
                )}
                <Editor
                  className={cn(
                    className,
                    "relative z-10 flex h-full w-full flex-col border-none !bg-transparent py-12 outline-none",
                    editorPaddingClass,
                    !initialContent?.alignment && "justify-center",
                    initialContent?.alignment === "start" && "justify-start",
                    initialContent?.alignment === "center" && "justify-center",
                    initialContent?.alignment === "end" && "justify-end",
                  )}
                  id={id}
                  autoFocus={autoFocus && !readOnly}
                  variant="ghost"
                  readOnly={isPreview || isGenerating || readOnly}
                  onFocus={() => {
                    // Update current slide index when editor receives focus
                    if (!readOnly && !isGenerating && !isPresenting) {
                      setCurrentSlideIndex(slideIndex);
                    }
                  }}
                />
              </div>
              {!readOnly && <ImageGenerationModel></ImageGenerationModel>}
            </Plate>
          )}
        </div>
      </TooltipProvider>
    );
  },
  (prev, next) => {
    // Prevent unnecessary re-renders when parent re-renders or callbacks change.
    // Only re-render when slide-specific props actually change.
    if (prev.id !== next.id) return false;
    // Deep-compare important slide fields using a stable JSON signature
    if (
      slideSignature(prev.initialContent) !==
      slideSignature(next.initialContent)
    ) {
      return false;
    }
    if (prev.readOnly !== next.readOnly) return false;
    if (prev.isPreview !== next.isPreview) return false;
    if (prev.className !== next.className) return false;
    if (prev.isGenerating !== next.isGenerating) return false;
    if (prev.slideIndex !== next.slideIndex) return false;
    // Intentionally ignore function prop identity (onChange) differences
    return true;
  },
);

PresentationEditor.displayName = "PresentationEditor";

export default PresentationEditor;

function PaletteInsertionListener() {
  const { pendingInsertNode, setPendingInsertNode } = usePresentationState();
  const editor = usePlateEditor({ id: "presentation" });
  useEffect(() => {
    if (!pendingInsertNode || !editor) return;
    try {
      const elem = pendingInsertNode as unknown as TElement;
      editor.tf.insertNodes(elem);
    } finally {
      setPendingInsertNode(null);
    }
  }, [pendingInsertNode, editor, setPendingInsertNode]);
  return null;
}
