"use client";
import { createSlateEditor, type Value } from "platejs";
import React, { useEffect, useMemo } from "react";

import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { type PlateSlide } from "../utils/parser";
import { EditorStatic } from "./custom-elements/static/editor-static";
import RootImageStatic from "./custom-elements/static/root-image-static";
import { PresentationEditorBaseKit } from "./plugins/presentation-editor-base-kit";
import { PresentationStaticCustomKit } from "./plugins/static-custom-kit";
import { PresentationStaticComponents } from "./plugins/static-kit";

interface PresentationEditorStaticViewProps {
  initialContent?: PlateSlide;
  className?: string;
  id?: string;
}

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

const PresentationEditorStaticView = React.memo(
  ({ initialContent, className, id }: PresentationEditorStaticViewProps) => {
    const { isPresenting } = usePresentationState();
    const editor = useMemo(
      () =>
        createSlateEditor({
          plugins: [
            ...PresentationEditorBaseKit,
            ...PresentationStaticCustomKit,
          ],
          components: PresentationStaticComponents,
          value: initialContent?.content ?? ([] as Value),
        }),
      [],
    );

    // Keep value in sync without recreating editor
    useEffect(() => {
      if (!initialContent?.content) return;
      editor.tf.setValue(initialContent.content);
    }, [editor, initialContent?.content]);

    const hasRootImage = Boolean(initialContent?.rootImage);
    const editorPaddingClass = hasRootImage ? "px-16 py-12" : "p-12";

    return (
      <div
        className={cn(
          "relative flex min-h-[500px] w-full",
          "scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 overflow-hidden p-0 scrollbar-thin scrollbar-track-transparent",
          "relative text-foreground",
          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50",
          className,
          !hasRootImage && initialContent?.layoutType === "right" && "flex-row",
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
        data-is-presenting={isPresenting ? "true" : "false"}
        data-slide-content="true"
      >
        <div className="relative flex h-full w-full">
          {initialContent?.rootImage && (
            <RootImageStatic
              image={initialContent.rootImage}
              layoutType={initialContent.layoutType}
              slideId={initialContent.id}
            />
          )}
          <EditorStatic
            className={cn(
              className,
              "relative z-10 flex h-full w-full flex-col border-none !bg-transparent outline-none",
              editorPaddingClass,
              initialContent?.alignment === "start" && "justify-start",
              initialContent?.alignment === "center" && "justify-center",
              initialContent?.alignment === "end" && "justify-end",
            )}
            id={id}
            editor={editor}
          />
        </div>
      </div>
    );
  },
  (prev, next) => {
    if (prev.id !== next.id) return false;
    if (
      slideSignature(prev.initialContent) !==
      slideSignature(next.initialContent)
    )
      return false;
    if (prev.className !== next.className) return false;
    return true;
  },
);

export default PresentationEditorStaticView;
