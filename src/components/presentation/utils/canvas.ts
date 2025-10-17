import { DEFAULT_CANVAS, type CanvasDoc } from "@/canvas/types";
import { nanoid } from "nanoid";
import type { PlateNode, PlateSlide } from "./parser";

const CANVAS_WIDTH = DEFAULT_CANVAS.width;
const CANVAS_HEIGHT = DEFAULT_CANVAS.height;

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

export function applyBackgroundImageToCanvas(
  canvas: CanvasDoc | null | undefined,
  imageUrl?: string | null,
): CanvasDoc {
  // Starte IMMER vom bestehenden Canvas und erhalte ALLE Nicht-Image-Nodes
  const base: CanvasDoc = {
    version: canvas?.version ?? 1,
    width: canvas?.width ?? CANVAS_WIDTH,
    height: canvas?.height ?? CANVAS_HEIGHT,
    bg: canvas?.bg ?? DEFAULT_CANVAS.bg,
    nodes: Array.isArray(canvas?.nodes) ? [...canvas!.nodes] : [],
    selection: Array.isArray(canvas?.selection) ? [...(canvas!.selection as any[])] : [],
    previewDataUrl: canvas?.previewDataUrl,
  };

  if (!imageUrl) {
    return base;
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

  // Entferne ausschließlich den bisherigen BG-Image-Knoten (falls vorhanden),
  // erhalte aber ALLE anderen Nodes (v. a. Text!)
  const withoutBg = base.nodes.filter((n: any) => !(n?.type === "image" && n?.id === "canvas-background-image"));

  // Prüfe Idempotenz: existiert bereits der gleiche BG?
  const prevBg = base.nodes.find((n: any) => n?.type === "image" && n?.id === "canvas-background-image") as any;
  if (prevBg) {
    const sameUrl = prevBg.url === imageNode.url;
    const sameSize = prevBg.width === imageNode.width && prevBg.height === imageNode.height;
    if (sameUrl && sameSize) {
      // nichts ändern
      return { ...base, nodes: base.nodes };
    }
  }

  // BG-Image immer als unterstes Element einfügen
  const mergedNodes = [imageNode, ...withoutBg];
  return { ...base, nodes: mergedNodes };
}

export function buildCanvasDocFromSlide(
  slide: PlateSlide,
): { canvas: CanvasDoc; position?: { x: number; y: number } } {
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

  let textPosition: { x: number; y: number } | undefined;
  if (segments.length > 0) {
    const content = segments.join("\n\n");
    const textWidth = Math.round(width * 0.7);
    const margin = Math.round(width * 0.1);
    const alignment =
      slide.alignment === "end"
        ? "right"
        : slide.alignment === "center"
          ? "center"
          : "left";

    let x = slide.position?.x ?? margin;
    if (!slide.position) {
      if (alignment === "center") {
        x = Math.max(margin, Math.round((width - textWidth) / 2));
      } else if (alignment === "right") {
        x = Math.max(margin, width - textWidth - margin);
      }
    }

    const y = slide.position?.y ?? Math.round(height * 0.22);
    const textColor = chooseTextColor(base.bg);
    base.nodes.push({
      id: `text-${nanoid()}`,
      type: "text",
      x,
      y,
      width: textWidth,
      text: content,
      fontFamily: "Inter",
      fontSize: pickFontSize(content.length),
      align: alignment,
      fill: textColor,
    });
    textPosition = { x, y };
  }

  const canvas = applyBackgroundImageToCanvas(base, slide.rootImage?.url);
  return { canvas, position: textPosition };
}

export function ensureSlideCanvas(slide: PlateSlide): PlateSlide {
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

  if (!hasImageNode && slide.rootImage?.url) {
    return {
      ...slide,
      canvas: applyBackgroundImageToCanvas(slide.canvas, slide.rootImage.url),
    };
  }

  return slide;
}

export function ensureSlidesHaveCanvas(slides: PlateSlide[]): PlateSlide[] {
  return slides.map((slide) => ensureSlideCanvas(slide));
}
