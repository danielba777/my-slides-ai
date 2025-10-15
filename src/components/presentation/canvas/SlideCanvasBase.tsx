"use client";

import type { CanvasDoc, CanvasTextNode } from "@/canvas/types";
import { usePresentationState } from "@/states/presentation-state";
import {
  type PlateNode,
  type PlateSlide,
} from "@/components/presentation/utils/parser";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Rect, Stage, Text, Image as KonvaImage } from "react-konva";

interface SlideCanvasProps {
  slide: PlateSlide;
  slideIndex: number;
  width?: number;
  height?: number;
  disableDrag?: boolean;
  showExportButton?: boolean;
}

function extractPlainText(nodes: PlateNode[]): string {
  const lines: string[] = [];

  const traverse = (node: any, depth: number) => {
    if (!node) return;
    if (typeof node.text === "string") {
      lines.push(node.text);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach((child: unknown) => traverse(child, depth + 1));
      if (node.type === "p" && depth === 0) {
        lines.push("\n");
      }
    }
  };

  nodes.forEach((node) => traverse(node, 0));

  const text = lines.join("").replace(/\n{2,}/g, "\n").trim();
  return text.length > 0 ? text : "Your slide text";
}

function useCanvasImage(src?: string): [HTMLImageElement | null] {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return [image];
}

export default function SlideCanvasBase({
  slide,
  slideIndex,
  width = 600,
  height = 900,
  disableDrag = false,
  showExportButton = true,
}: SlideCanvasProps) {
  type ExtendedSlide = PlateSlide & {
    position?: { x: number; y: number };
    canvas?: CanvasDoc;
  };
  const slideWithExtras = slide as ExtendedSlide;

  const stageRef = useRef<any>(null);
  const [image] = useCanvasImage(slide.rootImage?.url ?? "");

  const canvasDoc = slideWithExtras.canvas;
  const activeTextNode = useMemo(() => {
    if (!canvasDoc) return undefined;
    return canvasDoc.nodes.find(
      (node): node is CanvasTextNode => node.type === "text",
    );
  }, [canvasDoc]);

  const stageDimensions = useMemo(
    () => ({
      width: canvasDoc?.width ?? width,
      height: canvasDoc?.height ?? height,
    }),
    [canvasDoc?.height, canvasDoc?.width, height, width],
  );

  const defaultPosition = useMemo(
    () =>
      activeTextNode
        ? { x: activeTextNode.x, y: activeTextNode.y }
        : {
            x: stageDimensions.width / 2 - 150,
            y: stageDimensions.height / 2 - 60,
          },
    [activeTextNode, stageDimensions.height, stageDimensions.width],
  );

  const [textPosition, setTextPosition] = useState(
    slideWithExtras.position ?? defaultPosition,
  );

  useEffect(() => {
    setTextPosition(slideWithExtras.position ?? defaultPosition);
  }, [slideWithExtras.position?.x, slideWithExtras.position?.y, defaultPosition]);

  const textContent = useMemo(() => {
    if (activeTextNode?.text) {
      return activeTextNode.text;
    }
    return extractPlainText(slide.content ?? []);
  }, [activeTextNode?.text, slide.content]);

  const handleDragEnd = useCallback(
    (event: any) => {
      const next = { x: event.target.x(), y: event.target.y() };
      setTextPosition(next);
      const { slides, setSlides } = usePresentationState.getState();
      setSlides(
        slides.map((s, index) => {
          if (index !== slideIndex) return s;
          const updatedCanvas = s.canvas
            ? {
                ...s.canvas,
                nodes: s.canvas.nodes.map((node) =>
                  node.type === "text" && node.id === (activeTextNode?.id ?? node.id)
                    ? { ...node, x: next.x, y: next.y }
                    : node,
                ),
              }
            : s.canvas;
          return {
            ...s,
            position: next,
            canvas: updatedCanvas,
          };
        }),
      );
    },
    [activeTextNode?.id, slideIndex],
  );

  const exportToImage = () => {
    if (!stageRef.current) return;
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `slide-${slideIndex + 1}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {showExportButton && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={exportToImage}>
            Export PNG
          </Button>
        </div>
      )}
      <div className="flex w-full justify-center">
        <Stage
          ref={stageRef}
          width={stageDimensions.width}
          height={stageDimensions.height}
          className="shadow-lg"
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={stageDimensions.width}
              height={stageDimensions.height}
              fill={canvasDoc?.bg ?? slide.bgColor ?? "#111827"}
            />
            {image && (
              <KonvaImage
                image={image}
                x={0}
                y={0}
                width={stageDimensions.width}
                height={stageDimensions.height}
              />
            )}
            <Text
              text={textContent}
              fontSize={32}
              fontFamily="TikTok Sans, sans-serif"
              fill="#ffffff"
              x={textPosition.x}
              y={textPosition.y}
              draggable={!disableDrag}
              onDragEnd={handleDragEnd}
              shadowColor="rgba(0,0,0,0.45)"
              shadowBlur={8}
              shadowOpacity={0.8}
              shadowOffset={{ x: 0, y: 2 }}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
