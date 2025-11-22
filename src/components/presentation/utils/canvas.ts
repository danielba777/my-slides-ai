import { DEFAULT_CANVAS, type CanvasDoc, type CanvasTextNode } from "@/canvas/types";
import {
  TIKTOK_OUTLINE_WIDTH,
  TIKTOK_OUTLINE_COLOR,
  TIKTOK_TEXT_COLOR,
  TIKTOK_BACKGROUND_MODE,
  TIKTOK_BACKGROUND_COLOR,
  TIKTOK_BACKGROUND_OPACITY,
  TIKTOK_BACKGROUND_RADIUS,
  TIKTOK_BACKGROUND_PADDING_X,
  TIKTOK_BACKGROUND_PADDING_Y,
} from "@/canvas/tiktokDefaults";
import { nanoid } from "nanoid";
import type { PlateNode, PlateSlide } from "./parser";

const CANVAS_WIDTH = DEFAULT_CANVAS.width;
const CANVAS_HEIGHT = DEFAULT_CANVAS.height;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const resolveX = (nx: number, width: number) =>
  Math.round(clamp01(nx) * width);
const resolveY = (ny: number, height: number) =>
  Math.round(clamp01(ny) * height);

function collectTextSegments(nodes?: PlateNode[]): string[] {
  if (!Array.isArray(nodes)) return [];
  const segments: string[] = [];

  const visit = (node: any, bucket: string[]): void => {
    if (!node || typeof node !== "object") return;
    if (typeof node.text === "string" && node.text.trim()) {
      bucket.push(node.text.trim());
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        visit(child, bucket);
      }
    }
  };

  for (const node of nodes) {
    const bucket: string[] = [];
    visit(node, bucket);
    const merged = bucket.join(" ").replace(/\s+/g, " ").trim();
    if (merged) segments.push(merged);
  }

  return segments;
}

function chooseTextColor(background?: string | null): string {
  if (!background) return "#111827";
  const hex = background.replace("#", "").trim();
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex.padEnd(6, "0").slice(0, 6);
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return "#111827";
  }
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 140 ? "#f9fafb" : "#111827";
}

function pickFontSize(charCount: number): number {
  if (charCount > 360) return 42;
  if (charCount > 220) return 54;
  return 72;
}


export function applyTikTokTextStyle(
  node: Partial<CanvasTextNode>,
  styleMode: "outline" | "highlight" = "outline",
): Partial<CanvasTextNode> {
  if (styleMode === "outline") {
    
    return {
      ...node,
      fill: TIKTOK_TEXT_COLOR, 
      stroke: TIKTOK_OUTLINE_COLOR, 
      strokeWidth: TIKTOK_OUTLINE_WIDTH, 
    };
  } else {
    
    return {
      ...node,
      fill: TIKTOK_OUTLINE_COLOR, 
      background: {
        enabled: true,
        mode: TIKTOK_BACKGROUND_MODE, 
        color: TIKTOK_TEXT_COLOR, 
        opacity: TIKTOK_BACKGROUND_OPACITY, 
        paddingX: TIKTOK_BACKGROUND_PADDING_X, 
        paddingY: TIKTOK_BACKGROUND_PADDING_Y, 
        radius: TIKTOK_BACKGROUND_RADIUS, 
      },
    };
  }
}

export function applyBackgroundImageToCanvas(
  canvas: CanvasDoc | null | undefined,
  imageUrl?: string | null,
  gridImages?: Array<{ url?: string }> | null,
): CanvasDoc {
  
  const base: CanvasDoc = {
    version: canvas?.version ?? 1,
    width: canvas?.width ?? CANVAS_WIDTH,
    height: canvas?.height ?? CANVAS_HEIGHT,
    bg: canvas?.bg ?? DEFAULT_CANVAS.bg,
    nodes: Array.isArray(canvas?.nodes) ? [...canvas!.nodes] : [],
    selection: Array.isArray(canvas?.selection)
      ? [...(canvas!.selection as any[])]
      : [],
    previewDataUrl: canvas?.previewDataUrl,
  };

  
  const withoutBg = base.nodes.filter(
    (n: any) =>
      !(
        n?.type === "image" &&
        (n?.id === "canvas-background-image" ||
          n?.id?.startsWith("canvas-grid-image-"))
      ),
  );

  
  if (gridImages && Array.isArray(gridImages) && gridImages.length > 0) {
    const gridNodes: any[] = [];
    
    
    const cellWidth = base.width / 2;
    const cellHeight = base.height / 2;

    
    
    
    
    

    const positions = [
      { x: 0, y: 0, width: cellWidth, height: cellHeight }, 
      { x: cellWidth, y: 0, width: cellWidth, height: cellHeight }, 
      { x: 0, y: cellHeight, width: cellWidth, height: cellHeight }, 
      { x: cellWidth, y: cellHeight, width: cellWidth, height: cellHeight }, 
    ];

    for (let i = 0; i < 4; i++) {
      const img = gridImages[i];
      if (img?.url) {
        gridNodes.push({
          id: `canvas-grid-image-${i}`,
          type: "image" as const,
          ...positions[i],
          url: img.url,
        });
      }
    }

    return {
      ...base,
      nodes: [...gridNodes, ...withoutBg],
    };
  }

  
  if (!imageUrl) {
    return {
      ...base,
      nodes: withoutBg,
    };
  }

  const imageNode = {
    id: "canvas-background-image",
    type: "image" as const,
    x: 0,
    y: 0,
    width: base.width,
    height: base.height,
    url: imageUrl,
  };

  
  const prevBg = base.nodes.find(
    (n: any) => n?.type === "image" && n?.id === "canvas-background-image",
  ) as any;
  if (prevBg) {
    const sameUrl = prevBg.url === imageNode.url;
    const sameSize =
      prevBg.width === imageNode.width && prevBg.height === imageNode.height;
    if (sameUrl && sameSize) {
      
      return { ...base, nodes: base.nodes };
    }
  }

  
  const mergedNodes = [imageNode, ...withoutBg];
  return { ...base, nodes: mergedNodes };
}

export function buildCanvasDocFromSlide(slide: PlateSlide): {
  canvas: CanvasDoc;
  position?: { x: number; y: number };
} {
  const segments = collectTextSegments(slide.content);
  const width = slide.canvas?.width ?? CANVAS_WIDTH;
  const height = slide.canvas?.height ?? CANVAS_HEIGHT;
  const base: CanvasDoc = {
    version: slide.canvas?.version ?? 1,
    width,
    height,
    bg: slide.bgColor ?? slide.canvas?.bg ?? DEFAULT_CANVAS.bg,
    nodes: [],
    selection: [],
    previewDataUrl: slide.canvas?.previewDataUrl,
  };

  
  
  
  if (Array.isArray(slide.canvas?.nodes) && slide.canvas!.nodes.length > 0) {
    const hasMultiLineTextNode = slide.canvas.nodes.some((node) => {
      if (node.type !== "text") return false;
      const text = (node as any).text || (node as any).content || "";
      
      return text.includes("\n") && (text.includes("•") || text.includes("-"));
    });

    
    if (hasMultiLineTextNode) {
      console.log(
        "🔄 Migration: Splitting multi-line text node into separate elements",
      );
      const newNodes: any[] = [];
      let hasProcessedMultiLine = false;

      slide.canvas.nodes.forEach((node) => {
        if (node.type !== "text") {
          newNodes.push(node);
          return;
        }

        const textNode = node as any;
        const text = textNode.text || textNode.content || "";

        
        if (
          text.includes("\n") &&
          (text.includes("•") || text.includes("-")) &&
          !hasProcessedMultiLine
        ) {
          hasProcessedMultiLine = true;

          
          const lines = text
            .split("\n")
            .map((l: string) => l.trim())
            .filter(Boolean);

          
          const hasTitle =
            lines.length > 0 &&
            !lines[0]?.startsWith("•") &&
            !lines[0]?.startsWith("-");
          const title = hasTitle ? lines[0] : null;
          const bulletPoints = hasTitle ? lines.slice(1) : lines;

          const baseNx = textNode.nx ?? 0.5;
          const textColor = textNode.fill || chooseTextColor(base.bg);
          const textWidth = textNode.width ?? 1000;

          
          if (title) {
            newNodes.push({
              id: `text-title-${nanoid()}`,
              type: "text",
              x: resolveX(baseNx, width),
              y: resolveY(0.25, height),
              nx: baseNx,
              ny: 0.25,
              width: textWidth,
              text: title,
              fontFamily: textNode.fontFamily || "Inter",
              fontSize: (textNode.fontSize || 72) + 10,
              align: "center",
              fill: textColor,
            });
          }

          
          if (bulletPoints.length > 0) {
            const startY = title ? 0.4 : 0.3;
            const bulletSpacing = 0.08;

            bulletPoints.forEach((bullet: string, index: number) => {
              const bulletY = startY + index * bulletSpacing;

              newNodes.push({
                id: `text-bullet-${index}-${nanoid()}`,
                type: "text",
                x: resolveX(baseNx, width),
                y: resolveY(bulletY, height),
                nx: baseNx,
                ny: bulletY,
                width: textWidth,
                text: bullet,
                fontFamily: textNode.fontFamily || "Inter",
                fontSize: 50,
                align: "left",
                fill: textColor,
              });
            });
          }
        } else {
          
          newNodes.push(node);
        }
      });

      const updatedCanvas = {
        ...slide.canvas,
        nodes: newNodes,
      };

      const withBg = applyBackgroundImageToCanvas(
        updatedCanvas,
        slide.rootImage?.useGrid ? null : slide.rootImage?.url,
        slide.rootImage?.useGrid ? slide.rootImage.gridImages : null,
      );
      return { canvas: withBg, position: slide.position };
    }

    const withBg = applyBackgroundImageToCanvas(
      slide.canvas,
      slide.rootImage?.useGrid ? null : slide.rootImage?.url,
      slide.rootImage?.useGrid ? slide.rootImage.gridImages : null,
    );
    return { canvas: withBg, position: slide.position };
  }

  let textPosition: { x: number; y: number } | undefined;
  if (segments.length > 0) {
    const content = segments.join("\n\n");

    
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    
    const hasTitle =
      lines.length > 0 &&
      !lines[0]?.startsWith("•") &&
      !lines[0]?.startsWith("-");
    const title = hasTitle ? lines[0] : null;
    const bulletPoints = hasTitle ? lines.slice(1) : lines;

    const textWidth = 1000;
    const alignment = "center";
    const textColor = chooseTextColor(base.bg);

    
    const baseNx = slide.position?.x != null ? slide.position.x / width : 0.5;
    const baseNy = slide.position?.y != null ? slide.position.y / height : 0.5;

    if (title) {
      
      base.nodes.push({
        id: `text-title-${nanoid()}`,
        type: "text",
        x: resolveX(baseNx, width),
        y: resolveY(0.25, height),
        nx: baseNx,
        ny: 0.25, 
        width: textWidth,
        text: title,
        fontFamily: "Inter",
        fontSize: pickFontSize(title.length) + 10, 
        align: alignment,
        fill: textColor,
      });

      textPosition = {
        x: Math.round(baseNx * width),
        y: Math.round(0.25 * height),
      };
    }

    if (bulletPoints.length > 0) {
      
      const startY = title ? 0.4 : 0.3; 
      const bulletSpacing = 0.08; 
      const bulletFontSize = 50; 

      bulletPoints.forEach((bullet, index) => {
        const bulletY = startY + index * bulletSpacing;

        base.nodes.push({
          id: `text-bullet-${index}-${nanoid()}`,
          type: "text",
          x: resolveX(baseNx, width),
          y: resolveY(bulletY, height),
          nx: baseNx,
          ny: bulletY,
          width: textWidth,
          text: bullet,
          fontFamily: "Inter",
          fontSize: bulletFontSize,
          align: "left", 
          fill: textColor,
        });
      });

      if (!textPosition) {
        textPosition = {
          x: Math.round(baseNx * width),
          y: Math.round(startY * height),
        };
      }
    }

    
    if (base.nodes.length === 0) {
      base.nodes.push({
        id: `text-${nanoid()}`,
        type: "text",
        x: resolveX(baseNx, width),
        y: resolveY(baseNy, height),
        nx: baseNx,
        ny: baseNy,
        width: textWidth,
        text: content,
        fontFamily: "Inter",
        fontSize: pickFontSize(content.length),
        align: alignment,
        fill: textColor,
      });
      textPosition = {
        x: Math.round(baseNx * width),
        y: Math.round(baseNy * height),
      };
    }
  }

  const canvas = applyBackgroundImageToCanvas(
    base,
    slide.rootImage?.useGrid ? null : slide.rootImage?.url,
    slide.rootImage?.useGrid ? slide.rootImage.gridImages : null,
  );
  return { canvas, position: textPosition };
}

export function ensureSlideCanvas(slide: PlateSlide): PlateSlide {
  
  if (slide.canvas) {
    const correctHeight = CANVAS_HEIGHT; 
    if (slide.canvas.height !== correctHeight) {
      console.warn(
        `⚠️ Korrigiere Canvas-Höhe von ${slide.canvas.height} auf ${correctHeight}`,
      );
      slide = {
        ...slide,
        canvas: {
          ...slide.canvas,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
        },
      };
    }
  }

  const nodes = slide.canvas?.nodes ?? [];
  const hasTextNode = nodes.some((node) => {
    if (node.type !== "text") return false;
    const raw = (node as any).text ?? (node as any).content ?? "";
    return typeof raw === "string" && raw.trim().length > 0;
  });
  const hasImageNode = nodes.some(
    (node) => node.type === "image" && typeof (node as any).url === "string",
  );

  if (!hasTextNode) {
    const { canvas, position } = buildCanvasDocFromSlide(slide);
    return {
      ...slide,
      canvas,
      position: slide.position ?? position,
    };
  }

  
  const hasMultiLineTextNode = nodes.some((node) => {
    if (node.type !== "text") return false;
    const text = (node as any).text || (node as any).content || "";
    return text.includes("\n") && (text.includes("•") || text.includes("-"));
  });

  if (hasMultiLineTextNode && slide.canvas?.nodes) {
    console.log(
      "🔄 ensureSlideCanvas Migration: Splitting multi-line text nodes",
    );
    const width = slide.canvas.width ?? CANVAS_WIDTH;
    const height = slide.canvas.height ?? CANVAS_HEIGHT;
    const newNodes: any[] = [];
    let hasProcessedMultiLine = false;

    slide.canvas.nodes.forEach((node) => {
      if (node.type !== "text") {
        newNodes.push(node);
        return;
      }

      const textNode = node as any;
      const text = textNode.text || textNode.content || "";

      
      if (
        text.includes("\n") &&
        (text.includes("•") || text.includes("-")) &&
        !hasProcessedMultiLine
      ) {
        hasProcessedMultiLine = true;
        console.log("  ✂️ Splitting text node:", text.substring(0, 50) + "...");

        
        const lines = text
          .split("\n")
          .map((l: string) => l.trim())
          .filter(Boolean);

        
        const hasTitle =
          lines.length > 0 &&
          !lines[0]?.startsWith("•") &&
          !lines[0]?.startsWith("-");
        const title = hasTitle ? lines[0] : null;
        const bulletPoints = hasTitle ? lines.slice(1) : lines;

        const baseNx = textNode.nx ?? 0.5;
        const textColor =
          textNode.fill ||
          chooseTextColor(slide.canvas?.bg ?? DEFAULT_CANVAS.bg);
        const textWidth = textNode.width ?? 1000;

        
        if (title) {
          console.log("  📝 Creating title node:", title);
          newNodes.push({
            id: `text-title-${nanoid()}`,
            type: "text",
            x: resolveX(baseNx, width),
            y: resolveY(0.25, height),
            nx: baseNx,
            ny: 0.25,
            width: textWidth,
            text: title,
            fontFamily: textNode.fontFamily || "Inter",
            fontSize: (textNode.fontSize || 72) + 10,
            align: "center",
            fill: textColor,
          });
        }

        
        if (bulletPoints.length > 0) {
          const startY = title ? 0.4 : 0.3;
          const bulletSpacing = 0.08;

          bulletPoints.forEach((bullet: string, index: number) => {
            const bulletY = startY + index * bulletSpacing;
            console.log(
              `  🔸 Creating bullet ${index + 1}:`,
              bullet.substring(0, 30) + "...",
            );

            newNodes.push({
              id: `text-bullet-${index}-${nanoid()}`,
              type: "text",
              x: resolveX(baseNx, width),
              y: resolveY(bulletY, height),
              nx: baseNx,
              ny: bulletY,
              width: textWidth,
              text: bullet,
              fontFamily: textNode.fontFamily || "Inter",
              fontSize: 50,
              align: "left",
              fill: textColor,
            });
          });
        }
      } else {
        
        newNodes.push(node);
      }
    });

    slide = {
      ...slide,
      canvas: {
        ...slide.canvas,
        nodes: newNodes,
      },
    };
  }



  if (slide.canvas?.nodes) {
    const updatedNodes = slide.canvas.nodes.map((node) => {
      if (node.type !== "text") return node;
      const textNode = node as any;


      const hasNormalizedCoords = textNode.nx != null && textNode.ny != null;


      const updated = {
        ...textNode,
        width: textNode.width ?? 1000, // Use existing width or default
        align: textNode.align ?? "center", // Use existing align or default
        nx: hasNormalizedCoords ? textNode.nx : 0.5,
        ny: hasNormalizedCoords ? textNode.ny : 0.5,
        x: hasNormalizedCoords ? textNode.x : Math.round(0.5 * (slide.canvas?.width ?? 1080)),
        y: textNode.y,
      };

      return updated;
    });

    slide = {
      ...slide,
      canvas: {
        ...slide.canvas,
        nodes: updatedNodes,
      },
    };
  }

  if (!hasImageNode && slide.rootImage?.url) {
    return {
      ...slide,
      canvas: applyBackgroundImageToCanvas(
        slide.canvas,
        slide.rootImage.useGrid ? null : slide.rootImage.url,
        slide.rootImage.useGrid ? slide.rootImage.gridImages : null,
      ),
    };
  }

  return slide;
}

export function ensureSlidesHaveCanvas(slides: PlateSlide[]): PlateSlide[] {
  return slides.map((slide) => ensureSlideCanvas(slide));
}


export function applySlideTikTokStyle(
  slide: PlateSlide,
  styleMode: "outline" | "highlight" = "outline",
): PlateSlide {
  if (!slide.canvas?.nodes) {
    return slide;
  }

  const styledNodes = slide.canvas.nodes.map((node) => {
    if (node.type !== "text") {
      return node;
    }

    return applyTikTokTextStyle(node as CanvasTextNode, styleMode) as typeof node;
  });

  return {
    ...slide,
    canvas: {
      ...slide.canvas,
      nodes: styledNodes,
    },
  };
}
