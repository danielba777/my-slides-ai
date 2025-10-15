"use client";

import { usePresentationState } from "@/states/presentation-state";
import { Button } from "@/components/ui/button";
import {
  type PlateNode,
  type PlateSlide,
} from "@/components/presentation/utils/parser";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Layer, Stage, Text, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

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

export default function SlideCanvasBase({
  slide,
  slideIndex,
  width = 960,
  height = 540,
  disableDrag = false,
  showExportButton = true,
}: SlideCanvasProps) {
  type PositionedSlide = PlateSlide & { position?: { x: number; y: number } };
  const slideWithPosition = slide as PositionedSlide;
  const stageRef = useRef<any>(null);
  const [image] = useImage(slide.rootImage?.url ?? "", "anonymous");

  const initialPosition = slideWithPosition.position ?? {
    x: width / 2 - 200,
    y: height / 2 - 40,
  };

  const [textPosition, setTextPosition] = useState(initialPosition);

  useEffect(() => {
    setTextPosition(
      slideWithPosition.position ?? {
        x: width / 2 - 200,
        y: height / 2 - 40,
      },
    );
  }, [slideWithPosition.position?.x, slideWithPosition.position?.y, width, height]);

  const textContent = useMemo(
    () => extractPlainText(slide.content ?? []),
    [slide.content],
  );

  const handleDragEnd = useCallback(
    (event: any) => {
      const next = { x: event.target.x(), y: event.target.y() };
      setTextPosition(next);
      const { slides, setSlides } = usePresentationState.getState();
      setSlides(
        slides.map((s, index) =>
          index === slideIndex ? { ...s, position: next } : s,
        ),
      );
    },
    [slideIndex],
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
        <Stage ref={stageRef} width={width} height={height} className="shadow-lg">
          <Layer>
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill={slide.bgColor ?? "#111827"}
            />
            {image && (
              <KonvaImage
                image={image}
                x={0}
                y={0}
                width={width}
                height={height}
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
