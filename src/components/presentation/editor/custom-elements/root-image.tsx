"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useRootImageActions } from "@/hooks/presentation/useRootImageActions";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { Edit, ImageOff, Trash2 } from "lucide-react";
import { useEditorReadOnly } from "platejs/react";
import { Resizable } from "re-resizable";
import { useState } from "react";
import { type RootImage as RootImageType } from "../../utils/parser";
import ImagePlaceholder from "./image-placeholder";
import { PresentationImageEditor } from "./presentation-image-editor";

export interface RootImageProps {
  image: RootImageType;
  slideIndex: number;
  layoutType?: string;
  slideId: string;
}

export default function RootImage({
  image,
  slideIndex,
  layoutType,
  slideId,
}: RootImageProps) {
  // State for image editor sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // State for showing delete popover
  const [showDeletePopover, setShowDeletePopover] = useState(false);
  const setSlides = usePresentationState((s) => s.setSlides);
  const slides = usePresentationState((s) => s.slides);
  // Check if editor is in read-only mode
  const readOnly = useEditorReadOnly();

  const {
    computedGen,
    computedImageUrl,
    imageStyles,
    sizeStyle,
    isDragging,
    handleRef,
    removeRootImageFromSlide,
    onResizeStop,
    startRootImageGeneration,
  } = useRootImageActions(slideIndex, { image, layoutType, slideId });

  // Ensure popover closes when delete action is invoked
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeRootImageFromSlide();
    setShowDeletePopover(false);
  };

  // Double-click handler for the image
  const handleImageDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readOnly) {
      setIsSheetOpen(true);
    }
  };

  const removeImage = () => {
    setSlides(
      slides.map((slide, index) => {
        return slideIndex === index
          ? {
              ...slide,
              rootImage: { ...slide.rootImage!, url: undefined },
            }
          : slide;
      }),
    );
  };

  const isOverlayLayout =
    !layoutType ||
    layoutType === "background" ||
    layoutType === "left" ||
    layoutType === "right" ||
    layoutType === "vertical";

  if (isOverlayLayout) {
    return (
      <div className="absolute inset-0">
        <div
          className={cn(
            "absolute inset-0 overflow-hidden",
            computedGen?.status === "pending"
              ? "pointer-events-none"
              : computedImageUrl
                ? "pointer-events-none"
                : "pointer-events-auto",
          )}
        >
          {computedGen?.status === "pending" ? (
            <div className="flex h-full flex-col items-center justify-center bg-muted/40 p-4 text-background">
              <Spinner className="mb-2 h-10 w-10" />
              <p className="text-sm font-medium">
                Generating image for &quot;{image.query}&quot;...
              </p>
            </div>
          ) : !computedImageUrl ? (
            <ImagePlaceholder
              onGenerate={(prompt) => {
                startRootImageGeneration(slideId, prompt);
              }}
              isStatic={false}
              className="h-full w-full"
              slideIndex={slideIndex}
            />
          ) : (
            <div className="relative h-full w-full">
              {/** biome-ignore lint/performance/noImgElement: This is a valid use case */}
              <img
                src={computedImageUrl}
                alt={image.query}
                className="h-full w-full object-cover"
                style={imageStyles}
                onError={(e) => {
                  console.error("Image failed to load:", e, computedImageUrl);
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/60" />
            </div>
          )}
        </div>
        {!readOnly && (
          <div className="pointer-events-auto absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setIsSheetOpen(true);
              }}
              variant="secondary"
              size="sm"
              className="shadow-md"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Image
            </Button>
            {(computedImageUrl || image.url) && (
              <Popover
                open={showDeletePopover}
                onOpenChange={setShowDeletePopover}
              >
                <PopoverTrigger asChild>
                  <Button variant="destructive" size="sm" className="shadow-md">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" side="top" align="end">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRootImageFromSlide();
                      setShowDeletePopover(false);
                    }}
                    variant="destructive"
                    size="sm"
                    className="h-8"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Layout
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage();
                      setShowDeletePopover(false);
                    }}
                  >
                    <ImageOff className="mr-2 h-4 w-4" />
                    Delete Image
                  </Button>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}
        <PresentationImageEditor
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          layoutType={layoutType ?? ""}
          slideIndex={slideIndex}
          isRootImage={true}
          element={{
            type: "rootImage",
            children: [],
            ...image,
          }}
        />
      </div>
    );
  }

  return (
    <Resizable
      enable={{
        top: false,
        right: !readOnly && layoutType === "left",
        bottom: !readOnly && layoutType === "vertical",
        left: !readOnly && layoutType === "right",
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      size={sizeStyle}
      className="relative shrink-0 group/resizable"
      handleComponent={{
        right:
          !readOnly && layoutType === "left" ? (
            <div
              aria-label="resize-right"
              className="h-full w-1 cursor-ew-resize rounded-sm bg-primary/70 opacity-0 transition-opacity duration-150 group-hover/resizable:opacity-100"
            />
          ) : undefined,
        left:
          !readOnly && layoutType === "right" ? (
            <div
              aria-label="resize-left"
              className="h-full w-1 cursor-ew-resize rounded-sm bg-primary/70 opacity-0 transition-opacity duration-150 group-hover/resizable:opacity-100"
            />
          ) : undefined,
        bottom:
          !readOnly && layoutType === "vertical" ? (
            <div
              aria-label="resize-bottom"
              className="h-1 w-full cursor-ns-resize rounded-sm bg-primary/70 opacity-0 transition-opacity duration-150 group-hover/resizable:opacity-100"
            />
          ) : undefined,
      }}
      onResizeStop={onResizeStop}
    >
      <div
        className={cn(
          "h-full overflow-hidden border bg-background/80 shadow-md backdrop-blur-sm",
          isDragging && "opacity-50",
        )}
      >
        <div
          ref={handleRef}
          className="h-full cursor-grab active:cursor-grabbing"
        >
          {computedGen?.status === "pending" ? (
            <div className="flex h-full flex-col items-center justify-center bg-muted/30 p-4">
              <Spinner className="mb-2 h-8 w-8" />
              <p className="text-sm text-muted-foreground">
                Generating image for &quot;{image.query}&quot;...
              </p>
            </div>
          ) : !computedImageUrl ? (
            <ImagePlaceholder
              onGenerate={(prompt) => {
                startRootImageGeneration(slideId, prompt);
              }}
              isStatic={false}
              className="h-full"
              slideIndex={slideIndex}
            />
          ) : (
            <Popover
              open={!readOnly && showDeletePopover}
              onOpenChange={readOnly ? () => {} : setShowDeletePopover}
            >
              <PopoverTrigger asChild>
                <div
                  className="relative h-full"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!readOnly) {
                      setShowDeletePopover(true);
                    }
                  }}
                  onDoubleClick={handleImageDoubleClick}
                >
                  {/** biome-ignore lint/performance/noImgElement: This is a valid use case */}
                  <img
                    src={computedImageUrl}
                    alt={image.query}
                    className="" // Removed h-full w-full to avoid conflicts with inline styles
                    style={imageStyles} // All sizing and crop styles handled here
                    onError={(e) => {
                      console.error(
                        "Image failed to load:",
                        e,
                        computedImageUrl,
                      );
                    }}
                  />
                </div>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" side="top" align="center">
                <Button
                  onClick={handleImageDoubleClick}
                  variant="ghost"
                  size="sm"
                  className="h-8"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                {!image.url && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8"
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Layout
                  </Button>
                )}
                {image.url && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8"
                    onClick={removeImage}
                  >
                    <ImageOff className="mr-2 h-4 w-4" />
                    Delete Image
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      {/* Image Editor Sheet */}
      <PresentationImageEditor
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        layoutType={layoutType ?? ""}
        slideIndex={slideIndex}
        isRootImage={true}
        element={{
          type: "rootImage",
          children: [],
          ...image,
        }}
      />
    </Resizable>
  );
}
