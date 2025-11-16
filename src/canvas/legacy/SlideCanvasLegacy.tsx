
"use client";

import { loadImageDecoded } from "@/canvas/konva-helpers";
import LegacyEditorToolbar from "@/canvas/LegacyEditorToolbar";
import {
  TIKTOK_BACKGROUND_COLOR,
  TIKTOK_BACKGROUND_MODE,
  TIKTOK_BACKGROUND_OPACITY,
  TIKTOK_BACKGROUND_PADDING,
  TIKTOK_BACKGROUND_PADDING_X,
  TIKTOK_BACKGROUND_PADDING_Y,
  TIKTOK_BACKGROUND_RADIUS,
  TIKTOK_OUTLINE_COLOR,
  TIKTOK_OUTLINE_WIDTH,
  TIKTOK_TEXT_COLOR,
} from "@/canvas/tiktokDefaults";
import type { CanvasImageNode } from "@/canvas/types";
import { measureWrappedText } from "@/lib/textMetrics";
import type { SlideTextElement } from "@/lib/types";
import { usePresentationState } from "@/states/presentation-state";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";



type TextBgMode = "block" | "blob";

type TextLayer = {
  id: string;
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  weight: "regular" | "semibold" | "bold";
  scale: number;
  lineHeight: number;
  letterSpacing: number;
  align: "left" | "center" | "right";
  x: number;
  y: number;
  rotation: number;
  width: number;
  height?: number;
  zIndex: number;
  color: string;
  background?: SlideTextElement["background"];
};

export type SlideCanvasHandle = {
  getLayout: () => SlideTextElement[];
  exportPNG: () => Promise<Blob>;
  focusFirstText: () => void;
  clearTextFocus: () => void;
};

type Props = {
  imageUrl: string; 
  layout: SlideTextElement[];
  onLayoutChange?: (next: SlideTextElement[]) => void;
  
  overlays?: CanvasImageNode[];
  
  onOverlaysChange?: (next: CanvasImageNode[]) => void;
  
  showToolbar?: boolean;
  
  overlayContent?: React.ReactNode;
  
  onCloseToolbar?: () => void;
  
  readOnly?: boolean;
};

const W = 1080;
const H = 1620;
const PADDING = 8;
const BASE_FONT_PX = 72;
const SAFE_AREA_TOP = 100; // Safe area at top
const SAFE_AREA_BOTTOM = 100; // Safe area at bottom
const TEXT_WIDTH = 1000; // Almost full width text blocks

const DESCENT_PAD = Math.ceil(BASE_FONT_PX * 0.25); 


const MIN_TEXT_GAP = Math.max(1, Math.round(BASE_FONT_PX * 0.015));


const DIM_OVERLAY_OPACITY = 0.28; 


const TEXT_BASELINE = "middle";

function hexToRgba(hex: string, alpha: number): string {
  const clampedAlpha = Number.isFinite(alpha)
    ? Math.max(0, Math.min(1, alpha))
    : 1;
  let normalized = hex.trim().replace(/^#/, "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  const int = Number.parseInt(normalized, 16);
  if (!Number.isFinite(int)) return `rgba(0,0,0,${clampedAlpha})`;
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}

function toCssColor(
  color: string | undefined,
  opacity: number | undefined,
): string {
  const effectiveOpacity =
    opacity === undefined || Number.isNaN(opacity)
      ? 0.5
      : Math.max(0, Math.min(1, opacity));
  if (!color) return `rgba(0, 0, 0, ${effectiveOpacity})`;
  const trimmed = color.trim();
  if (trimmed.startsWith("#")) return hexToRgba(trimmed, effectiveOpacity);
  if (trimmed.startsWith("rgba(")) return trimmed;
  if (trimmed.startsWith("rgb(")) {
    const inner = trimmed.slice(4, -1);
    return `rgba(${inner}, ${effectiveOpacity})`;
  }
  return trimmed;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function fitContain(dstW: number, dstH: number, natW: number, natH: number) {
  const r = Math.min(dstW / natW, dstH / natH);
  const w = natW * r;
  const h = natH * r;
  const x = (dstW - w) / 2;
  const y = (dstH - h) / 2;
  return { w, h, x, y, scale: r };
}

function fitCover(dstW: number, dstH: number, natW: number, natH: number) {
  const r = Math.max(dstW / natW, dstH / natH);
  const w = natW * r;
  const h = natH * r;
  const x = (dstW - w) / 2;
  const y = (dstH - h) / 2;
  return { w, h, x, y, scale: r };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}


export const ASPECT_RATIO = 2 / 3;


function buildOuterTextShadow(px: number, color: string): string {
  const r = Math.max(0, Math.round(px));
  if (r <= 0) return "none";
  const steps: string[] = [];
  
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y);
      if (d > 0 && d <= r + 0.01) steps.push(`${x}px ${y}px 0 ${color}`);
    }
  }
  
  if (steps.length > 400) {
    const filtered: string[] = [];
    let c = 0;
    for (const s of steps) {
      if (c++ % Math.ceil(steps.length / 400) === 0) filtered.push(s);
    }
    return filtered.join(", ");
  }
  return steps.join(", ");
}


function layoutSignature(l: SlideTextElement[]): string {
  return JSON.stringify(
    l.map((x) => ({
      c: x.content ?? "",
      x: x.x ?? 0.5,
      y: x.y ?? 0.5,
      r: x.rotation ?? 0,
      s: x.scale ?? 1,
      w: x.maxWidth ?? 400,
      h: (x as any).maxHeight ?? 200,
      lh: x.lineHeight ?? 1.12,
      ls: x.letterSpacing ?? 0,
      z: x.zIndex ?? 0,
      a: x.align ?? "center",
      wt: x.weight ?? "regular",
      
      it: (x as any).italic ?? false,
      oe: (x as any).outlineEnabled ?? false,
      ow: (x as any).outlineWidth ?? TIKTOK_OUTLINE_WIDTH,
      oc: (x as any).outlineColor ?? TIKTOK_OUTLINE_COLOR,
      tc: (x as any).color ?? TIKTOK_TEXT_COLOR,
      bg: x.background
        ? {
            en: x.background.enabled ?? false,
            m: x.background.mode ?? TIKTOK_BACKGROUND_MODE,
            c: x.background.color ?? TIKTOK_BACKGROUND_COLOR,
            op: x.background.opacity ?? TIKTOK_BACKGROUND_OPACITY,
            px: x.background.paddingX ?? TIKTOK_BACKGROUND_PADDING_X,
            py: x.background.paddingY ?? TIKTOK_BACKGROUND_PADDING_Y,
            rd: x.background.radius ?? TIKTOK_BACKGROUND_RADIUS,
          }
        : null,
    })),
  );
}


async function waitFontsReady() {
  try {
    const d: any = document;
    if (d?.fonts?.ready) await d.fonts.ready;
  } catch {}
}


function computeWrappedLinesWithDOM(
  layer: TextLayer & {
    italic?: boolean;
  },
): string[] {
  const weight =
    layer.weight === "bold" ? 700 : layer.weight === "semibold" ? 600 : 400;

  
  const baseFontPx = BASE_FONT_PX;
  const lineHeightPx = baseFontPx * (layer.lineHeight ?? 1.12);

  const result = measureWrappedText({
    text: String(layer.content ?? ""),
    fontFamily: layer.fontFamily ?? "Inter",
    fontWeight: weight,
    fontStyle: (layer as any).italic ? "italic" : "normal",
    fontSizePx: baseFontPx,
    lineHeightPx,
    maxWidthPx: Math.max(8, layer.width),
    letterSpacingPx: layer.letterSpacing ?? 0,
    whiteSpaceMode: "pre-wrap",
    wordBreakMode: "normal",
    paddingPx: PADDING,
  });

  return result.lines;
}


function computeAutoHeightForLayer(
  layerBase: TextLayer & { italic?: boolean },
  _lines?: string[],
) {
  const weight =
    layerBase.weight === "bold"
      ? 700
      : layerBase.weight === "semibold"
        ? 600
        : 400;

  
  const baseFontPx = BASE_FONT_PX;
  const lineHeightPx = baseFontPx * (layerBase.lineHeight ?? 1.12);
  const m = measureWrappedText({
    text: String(layerBase.content ?? ""),
    fontFamily: layerBase.fontFamily ?? "Inter",
    fontWeight: weight,
    fontStyle: (layerBase as any).italic ? "italic" : "normal",
    fontSizePx: baseFontPx,
    lineHeightPx,
    maxWidthPx: Math.max(8, layerBase.width),
    letterSpacingPx: layerBase.letterSpacing ?? 0,
    whiteSpaceMode: "pre-wrap",
    wordBreakMode: "normal",
    paddingPx: PADDING,
  });
  return Math.max(40, Math.ceil(m.totalHeight));
}


function mapLayoutToLayers(layout: SlideTextElement[]): (TextLayer & {
  autoHeight?: boolean;
  italic?: boolean;
  outlineEnabled?: boolean;
  outlineWidth?: number;
  outlineColor?: string;
})[] {
  const layers = layout.map((el, i) => {
    const id = el.id ?? `layer-${i}`;
    const tmp: TextLayer & {
      autoHeight?: boolean;
      italic?: boolean;
      outlineEnabled?: boolean;
      outlineWidth?: number;
      outlineColor?: string;
    } = {
      id,
      x: W / 2, // Always center horizontally
      y: (el.y ?? 0.5) * H,
      width: TEXT_WIDTH,
      height: (el as any).maxHeight ?? 0,
      rotation: el.rotation ?? 0,
      scale: el.scale ?? 1,
      fontFamily: el.fontFamily ?? "Inter, system-ui, sans-serif",
      fontSize: BASE_FONT_PX * (el.scale ?? 1),
      lineHeight: el.lineHeight ?? 1.12,
      letterSpacing: el.letterSpacing ?? 0,
      weight:
        el.weight === "bold"
          ? "bold"
          : el.weight === "semibold"
            ? "semibold"
            : "regular",
      align: el.align ?? "center",
      color: (el as any).color ?? TIKTOK_TEXT_COLOR,
      content: el.content ?? "",
      zIndex: el.zIndex ?? i,
      italic: (el as any).italic ?? false,
      outlineEnabled: (el as any).outlineEnabled ?? true,
      outlineWidth: (el as any).outlineWidth ?? TIKTOK_OUTLINE_WIDTH,
      outlineColor: (el as any).outlineColor ?? TIKTOK_OUTLINE_COLOR,
      background: el.background
        ? {
            enabled: el.background.enabled ?? false,
            mode: el.background.mode ?? TIKTOK_BACKGROUND_MODE,
            color: el.background.color ?? TIKTOK_BACKGROUND_COLOR,
            opacity: el.background.opacity ?? TIKTOK_BACKGROUND_OPACITY,
            paddingX: el.background.paddingX ?? TIKTOK_BACKGROUND_PADDING_X,
            paddingY: el.background.paddingY ?? TIKTOK_BACKGROUND_PADDING_Y,
            radius: el.background.radius ?? TIKTOK_BACKGROUND_RADIUS,
            lineOverlap: el.background.lineOverlap ?? 0,
          }
        : undefined,
    };

    if (!tmp.height || tmp.height <= 0) {

      const lines = computeWrappedLinesWithDOM(tmp);
      tmp.height = Math.ceil(computeAutoHeightForLayer(tmp, lines));
      tmp.autoHeight = true;
    }

    return tmp;
  });

  // Apply dynamic font size and spacing based on number of text blocks
  if (layers.length > 1) {
    const sorted = [...layers].sort((a, b) => a.y - b.y);

    // Calculate dynamic font size based on number of blocks
    let fontScale = 1;
    if (sorted.length > 10) {
      fontScale = 0.65; // Very small for many blocks
    } else if (sorted.length > 7) {
      fontScale = 0.75; // Smaller for 8-10 blocks
    } else if (sorted.length > 5) {
      fontScale = 0.85; // Slightly smaller for 6-7 blocks
    } else if (sorted.length > 3) {
      fontScale = 0.9; // Almost normal for 4-5 blocks
    }

    // Apply font scale to all layers and recalculate heights
    sorted.forEach((layer) => {
      layer.fontSize = BASE_FONT_PX * (layer.scale ?? 1) * fontScale;
      // Recalculate height with new font size
      if (layer.autoHeight) {
        const lines = computeWrappedLinesWithDOM(layer);
        layer.height = Math.ceil(computeAutoHeightForLayer(layer, lines));
      }
    });

    // Calculate available space within safe areas
    const safeAreaHeight = H - SAFE_AREA_TOP - SAFE_AREA_BOTTOM;
    const totalTextHeight = sorted.reduce((sum, layer) => sum + (layer.height ?? 0), 0);
    const availableSpace = safeAreaHeight - totalTextHeight;
    const numGaps = sorted.length - 1;

    // Calculate dynamic gap - very compact spacing
    let dynamicGap = MIN_TEXT_GAP;
    if (sorted.length > 3) {
      // For more than 3 text blocks, use minimal spacing
      dynamicGap = Math.max(MIN_TEXT_GAP, Math.min(10, availableSpace / numGaps));
    } else {
      // For 2-3 blocks, use moderate spacing
      const calculatedGap = availableSpace / numGaps;
      dynamicGap = Math.max(MIN_TEXT_GAP, Math.min(calculatedGap, BASE_FONT_PX * 0.2));
    }

    // Position first block at top of safe area
    const firstBlock = sorted[0];
    if (firstBlock) {
      const firstHalf = (firstBlock.height ?? 0) / 2;
      firstBlock.y = SAFE_AREA_TOP + firstHalf;
    }

    // Position remaining blocks with dynamic gap
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (!prev || !cur) continue;
      const prevBottom = prev.y + (prev.height ?? 0) / 2;
      const curHalf = (cur.height ?? 0) / 2;
      cur.y = Math.round(prevBottom + dynamicGap + curHalf);
    }

    // Update original layers array with new positions, heights, and font sizes
    const updateMap = new Map(sorted.map((l) => [l.id, { y: l.y, height: l.height, fontSize: l.fontSize }]));
    layers.forEach((layer) => {
      const updates = updateMap.get(layer.id);
      if (updates) {
        layer.y = updates.y;
        layer.height = updates.height;
        layer.fontSize = updates.fontSize;
      }
    });
  } else if (layers.length === 1) {
    // Center single text block vertically
    const singleLayer = layers[0];
    if (singleLayer) {
      singleLayer.y = H / 2;
    }
  }

  return layers;
}


function mapLayersToLayout(
  textLayers: (TextLayer & {
    italic?: boolean;
    outlineEnabled?: boolean;
    outlineWidth?: number;
    outlineColor?: string;
  })[],
): SlideTextElement[] {
  return textLayers.map((layer) => ({
    id: layer.id,
    content: layer.content,
    fontFamily: layer.fontFamily,
    x: layer.x / W,
    y: layer.y / H,
    rotation: layer.rotation,
    scale: layer.scale,
    width: layer.width,
    maxWidth: layer.width,
    ...(layer.height ? { maxHeight: layer.height } : {}),
    lineHeight: layer.lineHeight,
    letterSpacing: layer.letterSpacing,
    zIndex: layer.zIndex,
    align: layer.align,
    weight:
      layer.weight === "bold"
        ? ("bold" as const)
        : layer.weight === "semibold"
          ? ("semibold" as const)
          : ("regular" as const),
    
    ...(layer.italic !== undefined ? { italic: layer.italic as any } : {}),
    ...(layer.outlineEnabled !== undefined
      ? { outlineEnabled: layer.outlineEnabled as any }
      : {}),
    ...(layer.outlineWidth !== undefined
      ? { outlineWidth: layer.outlineWidth as any }
      : {}),
    ...(layer.outlineColor !== undefined
      ? { outlineColor: layer.outlineColor as any }
      : {}),
    ...(layer.color !== undefined ? { color: layer.color as any } : {}),
    ...(layer.background ? { background: { ...layer.background } } : {}),
  }));
}

const SlideCanvas = forwardRef<SlideCanvasHandle, Props>(function SlideCanvas(
  {
    imageUrl,
    layout,
    onLayoutChange,
    overlays = [],
    onOverlaysChange,
    showToolbar = true,
    overlayContent,
    onCloseToolbar,
    readOnly,
  },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimBg, setDimBg] = React.useState(false);

  
  
  const dimOverlaySlideId = usePresentationState(
    (s) => s.editingOverlaySlideId,
  );
  const setDimOverlaySlideId = usePresentationState(
    (s) => s.setEditingOverlaySlideId,
  );

  
  const onLayout = useCallback(
    (next: SlideTextElement[]) => {
      if (typeof onLayoutChange === "function") {
        onLayoutChange(next);
      }
    },
    [onLayoutChange],
  );

  
  const getActiveId = () => isEditingRef.current ?? activeLayerId;
  const applyToActive = (updater: (l: TextLayer) => TextLayer) => {
    const id = getActiveId();
    if (!id) return;
    setTextLayers((prev) => prev.map((l) => (l.id === id ? updater(l) : l)));
  };

  const toggleBold = () => {
    applyToActive((l) => ({
      ...l,
      weight: l.weight === "bold" ? "regular" : "bold",
    }));
  };
  const toggleItalic = () => {
    applyToActive((l) => ({ ...l, italic: !(l as any).italic }));
  };
  const setAlign = (align: "left" | "center" | "right") => {
    applyToActive((l) => ({ ...l, align }));
  };
  
  const setFontScale = (scale: number) => {
    const s = Math.max(0.2, Math.min(4, Number.isFinite(scale) ? scale : 1));
    applyToActive((l) => ({ ...l, scale: s }));
  };
  const setTextColor = (color: string) => {
    applyToActive((l) => ({ ...l, color }));
  };
  const setOutlineColor = (color: string) => {
    applyToActive((l) => ({ ...l, outlineEnabled: true, outlineColor: color }));
  };

  
  const enforceMinVerticalSpacing = useCallback((layers: TextLayer[]) => {
    const next = [...layers].sort((a, b) => a.y - b.y);

    // Calculate dynamic gap based on number of text blocks
    let dynamicGap = MIN_TEXT_GAP;
    if (next.length > 3) {
      // For more than 3 text blocks, use minimal spacing
      dynamicGap = MIN_TEXT_GAP;
    } else if (next.length > 1) {
      // For 2-3 blocks, calculate normal gap
      const totalTextHeight = next.reduce((sum, layer) => sum + (layer.height ?? 0), 0);
      const availableSpace = H - (PADDING * 2) - totalTextHeight;
      const numGaps = next.length - 1;
      const calculatedGap = availableSpace / numGaps;
      dynamicGap = Math.max(MIN_TEXT_GAP, Math.min(calculatedGap, BASE_FONT_PX * 0.5));
    }

    for (let i = 1; i < next.length; i++) {
      const prev = next[i - 1];
      const cur = next[i];



      if (!prev || !cur) {
        return;
      }
      const prevTop = prev.y - (prev.height ?? 0) / 2;
      const prevBottom = prev.y + (prev.height ?? 0) / 2;
      const curTop = cur.y - (cur.height ?? 0) / 2;
      const neededTop = prevBottom + dynamicGap;
      if (curTop < neededTop) {
        const curHalf = (cur?.height ?? 0) / 2;
        const newY = neededTop + curHalf;
        if (cur) {
          cur.y = Math.round(newY);
        }
      }
    }

    const map = new Map(next.map((l) => [l.id, l.y]));
    return layers.map((l) => (map.has(l.id) ? { ...l, y: map.get(l.id)! } : l));
  }, []);

  
  const addNewTextLayer = () => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `txt-${Date.now()}`;
    const centerX = W / 2;
    const centerY = H / 2;
    const initial: TextLayer & {
      autoHeight?: boolean;
      italic?: boolean;
      outlineEnabled?: boolean;
      outlineWidth?: number;
      outlineColor?: string;
    } = {
      id,
      content: "New Text",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: BASE_FONT_PX,
      weight: "semibold",
      scale: 1,
      lineHeight: 1.12,
      letterSpacing: 0,
      align: "center",
      x: centerX,
      y: centerY,
      rotation: 0,
      width: TEXT_WIDTH,
      height: 0, 
      zIndex: (textLayers.at(-1)?.zIndex ?? 0) + 1,
      color: TIKTOK_TEXT_COLOR,
      autoHeight: true,
      italic: false,
      outlineEnabled: true,
      outlineWidth: TIKTOK_OUTLINE_WIDTH,
      outlineColor: TIKTOK_OUTLINE_COLOR,
    };
    const lines = computeWrappedLinesWithDOM(initial);
    initial.height = Math.ceil(computeAutoHeightForLayer(initial, lines));
    setTextLayers((prev) => [...prev, initial]);
    commitActiveLayer(id);
    setIsEditing(id);
    
    setTimeout(() => editorActiveRef.current?.focus(), 0);
  };

  
  useEffect(() => {
    const handler = () => {
      addNewTextLayer();
    };
    window.addEventListener("canvas:add-text", handler);
    return () => window.removeEventListener("canvas:add-text", handler);
  }, []);

  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [bgSelected, setBgSelected] = useState(false);
  const [imageNatural, setImageNatural] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const isPanning = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  
  const [overlayNodes, setOverlayNodes] = useState<CanvasImageNode[]>(
    () => overlays,
  );
  useEffect(() => {
    setOverlayNodes(overlays);
  }, [overlays]);

  const [natSizeMap, setNatSizeMap] = useState<
    Record<string, { w: number; h: number }>
  >({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const entries = await Promise.all(
        overlays.map(async (n) => {
          if (!n.url) return [n.id, { w: 1, h: 1 }] as const;
          await new Promise<void>((res) => {
            const img = new Image();
            img.onload = () => res();
            img.onerror = () => res();
            img.src = n.url;
          });
          
          const img2 = new Image();
          img2.src = n.url;
          const w = (img2 as any).naturalWidth || 1;
          const h = (img2 as any).naturalHeight || 1;
          return [n.id, { w, h }] as const;
        }),
      );
      if (!alive) return;
      const map: Record<string, { w: number; h: number }> = {};
      for (const [id, s] of entries) map[id] = s;
      setNatSizeMap(map);
    })();
    return () => {
      alive = false;
    };
  }, [overlays]);

  const commitOverlays = useCallback(
    (next: CanvasImageNode[]) => {
      setOverlayNodes(next);
      onOverlaysChange?.(next);
    },
    [onOverlaysChange],
  );

  
  const dragRef = useRef<{
    id: string | null;
    startX: number;
    startY: number;
    nodeStartX: number;
    nodeStartY: number;
  }>({ id: null, startX: 0, startY: 0, nodeStartX: 0, nodeStartY: 0 });

  const onOverlayPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, node: CanvasImageNode) => {
      e.stopPropagation();
      setBgSelected(false);
      setActiveLayerId(node.id);
      const rect = wrapRef.current?.getBoundingClientRect();
      const scaleFactor = rect ? W / rect.width : 1;
      dragRef.current = {
        id: node.id,
        startX: e.clientX * scaleFactor,
        startY: e.clientY * scaleFactor,
        nodeStartX: node.x,
        nodeStartY: node.y,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const onOverlayPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d.id) return;
      const rect = wrapRef.current?.getBoundingClientRect();
      const scaleFactor = rect ? W / rect.width : 1;
      const curX = e.clientX * scaleFactor;
      const curY = e.clientY * scaleFactor;
      const dx = curX - d.startX;
      const dy = curY - d.startY;
      const id = d.id;
      setOverlayNodes((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                x: clamp(d.nodeStartX + dx, -W, 2 * W),
                y: clamp(d.nodeStartY + dy, -H, 2 * H),
              }
            : n,
        ),
      );
    },
    [],
  );

  const onOverlayPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const had = dragRef.current.id;
      dragRef.current.id = null;
      if (had) commitOverlays(overlayNodes);
      if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    },
    [commitOverlays, overlayNodes],
  );

  
  const [textLayers, setTextLayers] = useState<
    (TextLayer & {
      autoHeight?: boolean;
      italic?: boolean;
      outlineEnabled?: boolean;
      outlineWidth?: number;
      outlineColor?: string;
    })[]
  >([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  
  const activeLayerIdRef = useRef<string | null>(null);
  const commitActiveLayer = useCallback((id: string | null) => {
    setActiveLayerId(id);
    activeLayerIdRef.current = id;
  }, []);

  
  useEffect(() => {
    activeLayerIdRef.current = activeLayerId;
  }, [activeLayerId]);

  
  const [isEditing, setIsEditing] = useState<string | null>(null); 
  const isEditingRef = useRef<string | null>(null);
  const toolbarMouseDownRef = useRef(false);
  const editorActiveRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  type DragMode =
    | "move-text"
    | "resize-left"
    | "resize-right"
    | "resize-top"
    | "resize-bottom"
    | "resize-nw"
    | "resize-ne"
    | "resize-sw"
    | "resize-se"
    | "rotate";
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const interactionStart = useRef<any>(null);
  const isInteracting = useRef(false);

  
  const lastSentLayoutSigRef = useRef<string>("");
  const layoutSig = useMemo(() => layoutSignature(layout), [layout]);

  useEffect(() => {
    const fromParent =
      layoutSig !== lastSentLayoutSigRef.current &&
      !isInteracting.current &&
      !isEditingRef.current;
    if (fromParent) setTextLayers(mapLayoutToLayers(layout) as any);
    
  }, [layoutSig]);

  
  
  useEffect(() => {
    setTextLayers(((prev) => {
      if (!prev || prev.length <= 1) return prev;
      return enforceMinVerticalSpacing(prev);
    }) as (
      prevState: (TextLayer & {
        autoHeight?: boolean;
        italic?: boolean;
        outlineEnabled?: boolean;
        outlineWidth?: number;
        outlineColor?: string;
      })[],
    ) => (TextLayer & {
      autoHeight?: boolean;
      italic?: boolean;
      outlineEnabled?: boolean;
      outlineWidth?: number;
      outlineColor?: string;
    })[]);
  }, [
    enforceMinVerticalSpacing,
     textLayers.length,
  ]);

  
  const [previewSize, setPreviewSize] = useState({
    w: 420,
    h: Math.round(420 * (H / W)),
  });

  
  useEffect(() => {
    setTextLayers(mapLayoutToLayers(layout) as any);
    
  }, []); 

  
  useEffect(() => {
    function fit() {
      const parent = wrapRef.current?.parentElement;
      if (!parent) return;
      const containerWidth = parent.clientWidth;
      
      let w = Math.max(420, Math.min(containerWidth - 8, 540));
      let h = Math.round(w * (H / W));
      
      const MAX_VH = 0.76;
      const maxH = Math.floor(window.innerHeight * MAX_VH);
      if (h > maxH) {
        h = maxH;
        w = Math.round(h * (W / H)); 
      }
      setPreviewSize({ w, h });
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  
  const pixelToCanvas = (clientX: number, clientY: number) => {
    if (!wrapRef.current) return { x: 0, y: 0 };
    const rect = wrapRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  
  
  const wheelHandler = useCallback(
    (e: WheelEvent) => {
      if (isEditingRef.current) return;
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) * (W / rect.width);
      const canvasY = (e.clientY - rect.top) * (H / rect.height);
      const factor = e.deltaY < 0 ? 1.06 : 0.94;

      
      if (activeLayerId && overlayNodes.some((n) => n.id === activeLayerId)) {
        e.preventDefault();
        e.stopPropagation();
        commitOverlays(
          overlayNodes.map((n) => {
            if (n.id !== activeLayerId) return n;
            
            const cx = n.x + n.width / 2;
            const cy = n.y + n.height / 2;
            const nextW = clamp(n.width * factor, 40, W * 2);
            const scale = nextW / n.width;
            const nextH = clamp(n.height * scale, 40, H * 2);
            
            return { ...n, width: nextW, height: nextH, x: n.x, y: n.y };
          }),
        );
        return;
      }

      
      
      return;
    },
    [activeLayerId, overlayNodes, commitOverlays],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.addEventListener("wheel", wheelHandler, { passive: false });
    return () => el.removeEventListener("wheel", wheelHandler as any);
  }, [wheelHandler]);

  
  const onBGPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    
    if (
      target.closest('[data-role="text-layer"]') ||
      target.closest('[data-role="handle"]')
    ) {
      return;
    }
    
    if (toolbarMouseDownRef.current) {
      return;
    }
    
    if (isEditingRef.current) {
      setIsEditing(null);
    }
    setActiveLayerId(null);
    setBgSelected(false); 
    
  };

  const onBGPointerMove = (e: React.PointerEvent) => {
    
    return;
  };

  const onBGPointerUp = (e: React.PointerEvent) => {
    
    return;
  };

  
  const handleCanvasDeselect = () => {
    commitActiveLayer(null);
    setIsEditing(null);
  };

  
  useEffect(() => {
    const onWindowPointerUp = () => {
      if (!isInteracting.current) return;
      isInteracting.current = false;
      setDragMode(null);
      const newLayout = mapLayersToLayout(textLayers as any);
      const sig = layoutSignature(newLayout);
      lastSentLayoutSigRef.current = sig;
      onLayout(newLayout);
    };
    window.addEventListener("pointerup", onWindowPointerUp);
    return () => window.removeEventListener("pointerup", onWindowPointerUp);
  }, [textLayers, onLayout]);

  
  const selectLayer = (layerId: string, e: React.PointerEvent) => {
    
    
    if (isEditingRef.current && isEditingRef.current !== layerId) {
      setIsEditing(null);
    }
    if (isEditingRef.current === layerId) {
      
      commitActiveLayer(layerId);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    commitActiveLayer(layerId);
    setDragMode("move-text");
    isInteracting.current = true;
    const start = pixelToCanvas(e.clientX, e.clientY);
    const layerStart = structuredClone(
      textLayers.find((l) => l.id === layerId)!,
    );
    interactionStart.current = { start, layerStart };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const startResize = (layerId: string, mode: any, e: React.PointerEvent) => {
    if (isEditingRef.current === layerId) {
      
      e.stopPropagation();
      e.preventDefault();
      commitActiveLayer(layerId);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    commitActiveLayer(layerId);
    setDragMode(mode);
    isInteracting.current = true;
    const start = pixelToCanvas(e.clientX, e.clientY);
    const layerStart = structuredClone(
      textLayers.find((l) => l.id === layerId)!,
    ) as TextLayer & {
      autoHeight?: boolean;
      italic?: boolean;
      outlineEnabled?: boolean;
      outlineWidth?: number;
      outlineColor?: string;
    };

    if (!layerStart.height || layerStart.height <= 0) {
      const lines = computeWrappedLinesWithDOM({
        ...layerStart,
        italic: (layerStart as any).italic,
      });
      layerStart.height = Math.max(
        1,
        Math.ceil(
          computeAutoHeightForLayer(
            { ...layerStart, italic: (layerStart as any).italic },
            lines,
          ),
        ),
      );
    }

    const aspect = layerStart.width / Math.max(layerStart.height ?? 0, 1);
    interactionStart.current = { start, layerStart, aspect, mode };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isPanning.current && !isInteracting.current) return onBGPointerMove(e);
    if (!dragMode || !activeLayerId || !isInteracting.current) return;
    e.preventDefault();
    const now = pixelToCanvas(e.clientX, e.clientY);
    const { start, layerStart, aspect, mode } = interactionStart.current;
    const dx = now.x - start.x;
    const dy = now.y - start.y;

    if (dragMode === "move-text") {
      setTextLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? { ...l, x: layerStart.x + dx, y: layerStart.y + dy }
            : l,
        ),
      );
      return;
    }

    const MIN_W = 40,
      MIN_H = 28,
      MIN_SCALE = 0.2;

    setTextLayers((prev) =>
      prev.map((l) => {
        if (l.id !== activeLayerId) return l;

        if (mode === "resize-left" || mode === "resize-right") {
          
          const dx = now.x - start.x;
          const delta = mode === "resize-left" ? -dx : dx;
          const nextW = Math.max(40, layerStart.width + delta);
          
          const computedHeight = Math.ceil(
            computeAutoHeightForLayer({
              ...l,
              width: nextW,
              italic: (l as any).italic,
            } as any),
          );
          const temp = {
            ...l,
            width: nextW,
            height: Math.max(40, computedHeight),
          } as TextLayer & { autoHeight?: boolean };
          (temp as any).autoHeight = true;
          return temp;
        }

        if (mode === "resize-top" || mode === "resize-bottom") {
          const s =
            1 +
            (mode === "resize-bottom" ? dy : -dy) /
              Math.max(1, layerStart.height);
          let requestedHeight = Math.max(
            MIN_H,
            Math.round(layerStart.height * s),
          );

          
          const weight =
            l.weight === "bold" ? 700 : l.weight === "semibold" ? 600 : 400;

          const baseFontPx = BASE_FONT_PX;
          const lineHeightPx = baseFontPx * (l.lineHeight ?? 1.12);

          const measureResult = measureWrappedText({
            text: String(l.content ?? ""),
            fontFamily: l.fontFamily ?? "Inter",
            fontWeight: weight,
            fontStyle: (l as any).italic ? "italic" : "normal",
            fontSizePx: baseFontPx,
            lineHeightPx,
            maxWidthPx: Math.max(8, l.width),
            letterSpacingPx: l.letterSpacing ?? 0,
            whiteSpaceMode: "pre-wrap",
            wordBreakMode: "normal",
            paddingPx: PADDING,
          });

          const minHeight = Math.max(
            MIN_H,
            Math.ceil(measureResult.totalHeight),
          );
          const height = Math.max(Math.ceil(requestedHeight), minHeight);

          
          return { ...l, height, autoHeight: false };
        }

        
        
        const rotatePoint = (x: number, y: number, angle: number) => {
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          return { x: x * cos - y * sin, y: x * sin + y * cos };
        };

        const center = { x: layerStart.x, y: layerStart.y };
        const p0 = rotatePoint(
          start.x - center.x,
          start.y - center.y,
          (-layerStart.rotation * Math.PI) / 180,
        );
        const p1 = rotatePoint(
          now.x - center.x,
          now.y - center.y,
          (-layerStart.rotation * Math.PI) / 180,
        );

        const startLen = Math.hypot(p0.x, p0.y) || 1;
        const currLen = Math.hypot(p1.x, p1.y) || 1;
        const s = currLen / startLen;

        const nextScale = Math.max(0.2, layerStart.scale * s);

        
        const keepW = Math.max(40, layerStart.width);
        const temp = {
          ...l,
          scale: nextScale,
          width: keepW,
        } as TextLayer & { autoHeight?: boolean };

        
        const lines = computeWrappedLinesWithDOM({
          ...temp,
          italic: (temp as any).italic,
        });
        temp.height = Math.ceil(
          computeAutoHeightForLayer(
            { ...temp, italic: (temp as any).italic },
            lines,
          ),
        );
        (temp as any).autoHeight = true;

        return temp;
      }),
    );
  };

  const onPointerUp = (e: React.PointerEvent) => {
    onBGPointerUp(e);
    setDragMode(null);
    isInteracting.current = false;
    const newLayout = mapLayersToLayout(textLayers as any);
    const sig = layoutSignature(newLayout);
    lastSentLayoutSigRef.current = sig;
    onLayout(newLayout);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  
  const onDoubleClick = (layerId: string) => setIsEditing(layerId);

  const onTextareaChange = (
    layerId: string,
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const text = e.target.value;
    setTextLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        const next = { ...l, content: text } as TextLayer & {
          autoHeight?: boolean;
        };
        if (next.autoHeight) {
          next.height = Math.ceil(
            computeAutoHeightForLayer({
              ...next,
              italic: (next as any).italic,
            }),
          );
        }
        return next;
      }),
    );
  };

  const onTextBlur = (layerId: string) => {
    
    if (toolbarMouseDownRef.current) {
      setTimeout(() => editorActiveRef.current?.focus(), 0);
      return;
    }
    setIsEditing(null);
    const newLayout = mapLayersToLayout(textLayers as any);
    const sig = layoutSignature(newLayout);
    lastSentLayoutSigRef.current = sig;
    onLayout(newLayout);
  };

  
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ae = document.activeElement as HTMLElement | null;
      const isInputFocused =
        !!ae &&
        (ae.tagName === "INPUT" ||
          ae.tagName === "TEXTAREA" ||
          ae.isContentEditable ||
          ae.closest("[contenteditable='true']") !== null);

      const selectedId = activeLayerIdRef.current;
      const isDeleteKey =
        e.key === "Delete" ||
        e.key === "Backspace" ||
        
        
        ((e.metaKey || e.ctrlKey) && e.key === "Backspace");

      if (
        isDeleteKey &&
        !isInputFocused &&
        selectedId &&
        isEditingRef.current === null
      ) {
        e.preventDefault();
        e.stopPropagation();
        setTextLayers((prev) => {
          const updated = prev.filter((l) => l.id !== selectedId);
          
          const newLayout = mapLayersToLayout(updated as any);
          const sig = layoutSignature(newLayout);
          lastSentLayoutSigRef.current = sig;
          onLayout(newLayout);
          commitActiveLayer(null);
          return updated;
        });
      }
    };
    
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
    
  }, [onLayout]);

  
  const layoutChangeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    if (isInteracting.current || isEditingRef.current) return;
    if (layoutChangeTimeoutRef.current)
      clearTimeout(layoutChangeTimeoutRef.current);
    layoutChangeTimeoutRef.current = setTimeout(() => {
      const newLayout = mapLayersToLayout(textLayers as any);
      const sig = layoutSignature(newLayout);
      if (sig !== lastSentLayoutSigRef.current) {
        lastSentLayoutSigRef.current = sig;
        onLayout(newLayout);
      }
    }, 100);
    return () =>
      layoutChangeTimeoutRef.current &&
      clearTimeout(layoutChangeTimeoutRef.current);
  }, [textLayers, onLayout]); 

  
  const exportPNG = useCallback(async (): Promise<Blob> => {
    await waitFontsReady();

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = W;
    canvas.height = H;

    
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = W;
    offscreenCanvas.height = H;
    const exportCtx = offscreenCanvas.getContext("2d")!;

    
    exportCtx.textBaseline = TEXT_BASELINE as CanvasTextBaseline;
    exportCtx.textAlign = "left";

    
    if (imageUrl) {
      
      const img = await loadImageDecoded(imageUrl);
      const fit = fitCover(W, H, img.naturalWidth, img.naturalHeight);
      exportCtx.save();
      exportCtx.scale(fit.scale, fit.scale);
      exportCtx.translate(fit.x, fit.y);
      exportCtx.drawImage(img, 0, 0, fit.w, fit.h);
      exportCtx.restore();
    } else {
      exportCtx.fillStyle = "#000000";
      exportCtx.fillRect(0, 0, W, H);
    }

    
    
    
    
    if (dimBg) {
      exportCtx.save();
      exportCtx.fillStyle = `rgba(0,0,0,${DIM_OVERLAY_OPACITY})`;
      exportCtx.fillRect(0, 0, W, H);
      exportCtx.restore();
    }

  
  
  for (const n of overlayNodes) {
      const isGridImage = n.id.startsWith("canvas-grid-image-");
      let left: number, top: number, w: number, h: number;
      if (isGridImage) {
        
        left = n.x;
        top = n.y;
        w = n.width;
        h = n.height;
      } else {
        
        const nat = natSizeMap[n.id] || { w: 1, h: 1 };
        const f = fitContain(n.width, n.height, nat.w, nat.h);
        left = Math.round(n.x + f.x);
        top = Math.round(n.y + f.y);
        w = Math.round(f.w);
        h = Math.round(f.h);
      }
      await new Promise<void>((res) => {
        const img = new Image();
        img.onload = () => {
          try {
            exportCtx.drawImage(img, left, top, w, h);
          } catch {}
          res();
        };
        img.onerror = () => res();
        img.crossOrigin = "anonymous";
        img.src = n.url;
      });
    }

    
  
    const sorted = [...textLayers].sort((a, b) => a.zIndex - b.zIndex);
    for (const layer of sorted) {
      if (!layer.content) continue;

      
      const bgConfigCheck = layer.background;
      const bgEnabledCheck =
        (bgConfigCheck?.enabled ?? false) || (bgConfigCheck?.opacity ?? 0) > 0;
      
      
      const effectiveLineHeight = bgEnabledCheck ? 1.4 : (layer.lineHeight ?? 1.12);

      
      const measure = measureWrappedText({
        text: String(layer.content ?? ""),
        fontFamily: layer.fontFamily ?? "Inter",
        fontWeight:
          layer.weight === "bold"
            ? 700
            : layer.weight === "semibold"
              ? 600
              : 400,
        fontStyle: (layer as any).italic ? "italic" : "normal",
        fontSizePx: BASE_FONT_PX,
        lineHeightPx: BASE_FONT_PX * effectiveLineHeight,
        maxWidthPx: Math.max(8, layer.width),
        letterSpacingPx: layer.letterSpacing ?? 0,
        whiteSpaceMode: "pre-wrap",
        wordBreakMode: "normal",
        paddingPx: PADDING,
      });

      const lines = computeWrappedLinesWithDOM(layer as any);
      const weight =
        layer.weight === "bold" ? 700 : layer.weight === "semibold" ? 600 : 400;
      const italic = (layer as any).italic;
      const layerHeight =
        layer.height && layer.height > 0
          ? layer.height
          : Math.max(
              1,
              
              computeAutoHeightForLayer(
                { ...layer, italic: (layer as any).italic },
                lines,
              ),
            );

      const scaleFactor = Math.max(0.001, layer.scale);
      const halfW = (layer.width * scaleFactor) / 2;
      const halfH = (layerHeight * scaleFactor) / 2;
      const left = layer.x - halfW;
      const right = layer.x + halfW;
      const top = layer.y - halfH;
      const bottom = layer.y + halfH;

      const fullyOutside = right < 0 || left > W || bottom < 0 || top > H;
      if (fullyOutside) continue;

      exportCtx.save();

      exportCtx.translate(layer.x, layer.y);

      exportCtx.rotate((layer.rotation * Math.PI) / 180);

      exportCtx.scale(scaleFactor, scaleFactor);

      const boxLeft = -layer.width / 2;

      const boxTop = -layerHeight / 2;

      const clipRect = {
        x: boxLeft,
        y: boxTop,
        width: layer.width,
        
        height: layerHeight,
      };

      const contentWidth = Math.max(0, layer.width - 2 * PADDING);

      const contentHeight = Math.max(0, layerHeight - 2 * PADDING);

      exportCtx.font = `${italic ? "italic " : ""}${weight} ${BASE_FONT_PX}px ${layer.fontFamily}`;

      (exportCtx as any).fontKerning = "normal";

      exportCtx.fillStyle = layer.color;
      
      exportCtx.textBaseline = TEXT_BASELINE as CanvasTextBaseline;

      
      const lineMeasure = measureWrappedText({
        text: String(layer.content ?? ""),
        fontFamily: layer.fontFamily ?? "Inter",
        fontWeight: weight,
        fontStyle: italic ? "italic" : "normal",
        fontSizePx: BASE_FONT_PX,
        lineHeightPx: BASE_FONT_PX * effectiveLineHeight,
        maxWidthPx: Math.max(8, layer.width),
        letterSpacingPx: layer.letterSpacing ?? 0,
        whiteSpaceMode: "pre-wrap",
        wordBreakMode: "normal",
        paddingPx: PADDING,
      });
      const lineHeightPx = lineMeasure.lineHeight;
      
      let y = boxTop + PADDING + lineHeightPx / 2;

      const bgConfig = layer.background;
      const bgEnabled =
        (bgConfig?.enabled ?? false) || (bgConfig?.opacity ?? 0) > 0;

      
      const drawLineBackground = (
        lineText: string,
        lineY: number,
        lineHeightPx: number,
      ) => {
        if (!bgEnabled) return;

        const padX = Math.max(
          0,
          bgConfig?.paddingX ?? TIKTOK_BACKGROUND_PADDING_X,
        );
        const padY = Math.max(
          0,
          bgConfig?.paddingY ?? TIKTOK_BACKGROUND_PADDING_Y,
        );
        const radius = Math.max(
          0,
          bgConfig?.radius ?? TIKTOK_BACKGROUND_RADIUS,
        );
        const fill = toCssColor(bgConfig?.color, bgConfig?.opacity);

        
        exportCtx.save();
        exportCtx.font = `${italic ? "italic " : ""}${weight} ${BASE_FONT_PX}px ${layer.fontFamily}`;

        let lineWidth = 0;
        if (layer.letterSpacing === 0) {
          lineWidth = exportCtx.measureText(lineText).width;
        } else {
          for (const ch of lineText) {
            lineWidth += exportCtx.measureText(ch).width;
          }
          if (lineText.length > 1) {
            lineWidth += layer.letterSpacing * (lineText.length - 1);
          }
        }

        
        const textW = Math.max(0, layer.width - 2 * PADDING);
        let boxX: number;

        if (layer.align === "left") {
          boxX = boxLeft + PADDING - padX;
        } else if (layer.align === "right") {
          boxX = boxLeft + PADDING + textW - lineWidth - padX;
        } else {
          
          boxX = boxLeft + PADDING + (textW - lineWidth) / 2 - padX;
        }

        const boxY = lineY - lineHeightPx / 2 - padY;
        const boxWidth = lineWidth + padX * 2;
        const boxHeight = lineHeightPx + padY * 2;

        const effectiveRadius =
          bgConfig?.mode === "blob"
            ? Math.max(radius, Math.min(radius * 1.5, 1600))
            : radius;

        exportCtx.fillStyle = fill;
        drawRoundedRect(
          exportCtx,
          boxX,
          boxY,
          boxWidth,
          boxHeight,
          effectiveRadius,
        );
        exportCtx.fill();
        exportCtx.restore();
      };

      
      let backgroundRect: {
        x: number;
        y: number;
        width: number;
        height: number;
        radius: number;
        fill: string;
      } | null = null;
      if (bgEnabled) {
        const padX = Math.max(
          0,
          bgConfig?.paddingX ?? TIKTOK_BACKGROUND_PADDING_X,
        );
        const padY = Math.max(
          0,
          bgConfig?.paddingY ?? TIKTOK_BACKGROUND_PADDING_Y,
        );
        const radius = Math.max(
          0,
          bgConfig?.radius ?? TIKTOK_BACKGROUND_RADIUS,
        );
        const fill = toCssColor(bgConfig?.color, bgConfig?.opacity);
        const contentW = Math.max(0, layer.width - 2 * PADDING);
        const contentH = Math.max(0, layerHeight - 2 * PADDING);
        const rectX = boxLeft + PADDING - padX;
        const rectY = boxTop + PADDING - padY;
        const rectWidth = contentW + padX * 2;
        const rectHeight = contentH + padY * 2;
        backgroundRect = {
          x: rectX,
          y: rectY,
          width: rectWidth,
          height: rectHeight,
          radius:
            bgConfig?.mode === "blob"
              ? Math.max(radius, Math.min(radius * 1.5, 1600))
              : radius,
          fill,
        };
      }

      const outlineEnabled = (layer as any).outlineEnabled;

      const outlineWidth = (layer as any).outlineWidth ?? TIKTOK_OUTLINE_WIDTH;

      const outlineColor = (layer as any).outlineColor ?? TIKTOK_OUTLINE_COLOR;

      const scaledOutlineRadius =
        outlineEnabled && outlineWidth > 0
          ? Math.max(0.001, layer.scale) * outlineWidth
          : 0;

      const strokeMargin =
        scaledOutlineRadius > 0 ? Math.ceil(scaledOutlineRadius + 4) : 0;

      const clipBaseLeft = clipRect.x;

      const clipBaseTop = clipRect.y;

      const clipBaseRight = clipRect.x + clipRect.width;

      const clipBaseBottom = clipRect.y + clipRect.height;

      const backgroundOverflowLeft = backgroundRect
        ? Math.max(0, clipBaseLeft - backgroundRect.x)
        : 0;

      const backgroundOverflowTop = backgroundRect
        ? Math.max(0, clipBaseTop - backgroundRect.y)
        : 0;

      const backgroundOverflowRight = backgroundRect
        ? Math.max(
            0,

            backgroundRect.x + backgroundRect.width - clipBaseRight,
          )
        : 0;

      const backgroundOverflowBottom = backgroundRect
        ? Math.max(
            0,

            backgroundRect.y + backgroundRect.height - clipBaseBottom,
          )
        : 0;

      const clipMarginLeft = Math.max(
        strokeMargin,
        Math.ceil(backgroundOverflowLeft + 1),
      );

      const clipMarginTop = Math.max(
        strokeMargin,
        Math.ceil(backgroundOverflowTop + 1),
      );

      const clipMarginRight = Math.max(
        strokeMargin,
        Math.ceil(backgroundOverflowRight + 1),
      );

      const clipMarginBottom = Math.max(
        strokeMargin,

        Math.ceil(backgroundOverflowBottom + 1),
      );

      exportCtx.save();
      exportCtx.beginPath();

      exportCtx.rect(
        clipRect.x - clipMarginLeft,

        clipRect.y - clipMarginTop,

        clipRect.width + clipMarginLeft + clipMarginRight,

        clipRect.height + clipMarginTop + clipMarginBottom,
      );

      exportCtx.clip();

      
      const perGlyph = (
        cb: (ch: string, x: number, y: number) => void,
        text: string,
        startX: number,
        y: number,
      ) => {
        let x = startX;
        for (const ch of text) {
          cb(ch, x, y);
          x += exportCtx.measureText(ch).width + layer.letterSpacing;
        }
      };

      const drawOuterStrokeLine = (raw: string, yPos: number) => {
        if (!(outlineEnabled && outlineWidth > 0)) return;

        const baseStroke = outlineWidth * Math.max(0.001, layer.scale);
        const effectiveLineWidth = 2 * (baseStroke + 1);
        const margin = Math.max(
          strokeMargin,
          Math.ceil(effectiveLineWidth / 2),
        );
        const off = document.createElement("canvas");

        off.width = Math.max(1, Math.ceil(layer.width + margin * 2));

        off.height = Math.max(
          1,

          Math.ceil(layerHeight + DESCENT_PAD + margin * 2),
        );

        const ox = off.getContext("2d")!;

        ox.font = exportCtx.font;
        
        ox.textBaseline = TEXT_BASELINE as CanvasTextBaseline;

        (ox as any).fontKerning = "normal";

        const baseLeft = -layer.width / 2;

        const baseTop = -layerHeight / 2;

        const offsetX = margin;

        const offsetY = margin;

        const textW = Math.max(0, layer.width - 2 * PADDING);

        let startX = baseLeft + PADDING;

        if (layer.align === "center") startX = baseLeft + PADDING + textW / 2;
        else if (layer.align === "right") startX = baseLeft + PADDING + textW;

        const localX = startX - baseLeft + offsetX;

        const localY = yPos - baseTop + offsetY;

        ox.lineJoin = "round";
        ox.miterLimit = 2;
        ox.strokeStyle = outlineColor;
        ox.lineWidth = effectiveLineWidth;

        if (layer.letterSpacing === 0) {
          if (layer.align === "left") ox.textAlign = "left";
          else if (layer.align === "right") ox.textAlign = "right";
          else ox.textAlign = "center";

          ox.strokeText(raw, localX, localY);
        } else {
          perGlyph(
            (ch, x, yy) => {
              ox.strokeText(ch, x - baseLeft + offsetX, yy - baseTop + offsetY);
            },

            raw,

            startX,

            yPos,
          );
        }

        ox.globalCompositeOperation = "destination-out";

        ox.fillStyle = "#000";

        if (layer.letterSpacing === 0) {
          if (layer.align === "left") ox.textAlign = "left";
          else if (layer.align === "right") ox.textAlign = "right";
          else ox.textAlign = "center";

          ox.fillText(raw, localX, localY);
        } else {
          perGlyph(
            (ch, x, yy) => {
              ox.fillText(ch, x - baseLeft + offsetX, yy - baseTop + offsetY);
            },

            raw,

            startX,

            yPos,
          );
        }

        ox.globalCompositeOperation = "source-over";

        exportCtx.drawImage(
          off,
          -layer.width / 2 - offsetX,
          -layerHeight / 2 - offsetY,
        );
      };

      const drawFillLine = (raw: string, yPos: number) => {
        const textW = Math.max(0, layer.width - 2 * PADDING);
        
        exportCtx.save();
        exportCtx.shadowColor = "rgba(0,0,0,0.8)";
        exportCtx.shadowOffsetX = 0;
        exportCtx.shadowOffsetY = 2;
        exportCtx.shadowBlur = 8;
        if (layer.letterSpacing === 0) {
          if (layer.align === "left") {
            exportCtx.textAlign = "left";
            exportCtx.fillText(raw, -layer.width / 2 + PADDING, yPos);
          } else if (layer.align === "right") {
            exportCtx.textAlign = "right";
            exportCtx.fillText(raw, -layer.width / 2 + PADDING + textW, yPos);
          } else {
            exportCtx.textAlign = "center";
            exportCtx.fillText(
              raw,
              -layer.width / 2 + PADDING + textW / 2,
              yPos,
            );
          }
        } else {
          let visualWidth = 0;
          for (const ch of raw) visualWidth += exportCtx.measureText(ch).width;
          if (raw.length > 1)
            visualWidth += layer.letterSpacing * (raw.length - 1);
          let startX: number;
          if (layer.align === "left") startX = -layer.width / 2 + PADDING;
          else if (layer.align === "right")
            startX = -layer.width / 2 + PADDING + textW - visualWidth;
          else startX = -layer.width / 2 + PADDING + (textW - visualWidth) / 2;
          perGlyph(
            (ch, x, yy) => exportCtx.fillText(ch, x, yy),
            raw,
            startX,
            yPos,
          );
        }
        exportCtx.restore();
      };

      for (const raw of lines) {
        if (y - (boxTop + PADDING) > contentHeight + 1) break;
        
        drawLineBackground(raw, y, lineHeightPx);
        
        drawOuterStrokeLine(raw, y);
        
        drawFillLine(raw, y);
        y += lineHeightPx;
      }

      exportCtx.restore();
      exportCtx.restore();
    }

    

    return new Promise<Blob>((resolve, reject) => {
      offscreenCanvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
        "image/png",
      );
    });
  }, [textLayers, imageUrl, scale, offset, overlayNodes, natSizeMap]);

  useImperativeHandle(
    ref,
    () => ({
      getLayout: () => mapLayersToLayout(textLayers as any),
      exportPNG,
      focusFirstText: () => {
        if (textLayers.length > 0 && !activeLayerId) {
          setActiveLayerId(textLayers[0]!.id);
        }
      },
      clearTextFocus: () => {
        setActiveLayerId(null);
        setIsEditing(null);
      },
    }),
    [textLayers, exportPNG, activeLayerId],
  );

  
  const scaleFactor = previewSize.w / W;
  const active = textLayers.find((l) => l.id === activeLayerId) as
    | (TextLayer & {
        italic?: boolean;
        outlineEnabled?: boolean;
        outlineWidth?: number;
        outlineColor?: string;
      })
    | undefined;
  const handleAddText = useCallback(() => {
    addNewTextLayer();
  }, [textLayers]);

  
  const handleToolbarPatch = useCallback(
    (patch: Partial<SlideTextElement>) => {
      
      if (patch.background) {
        applyToActive((l) => {
          
          type BgPatch = {
            opacity?: number;
            paddingX?: number;
            paddingY?: number;
            mode?: "block" | "blob";
            color?: string;
            radius?: number;
            lineOverlap?: number;
          };
          const prevBg = (l.background ?? {}) as Partial<BgPatch>;
          const targetOpacity =
            patch.background?.opacity ?? prevBg.opacity ?? 0;
          const fallbackPadding =
            patch.background?.paddingX ??
            patch.background?.paddingY ??
            prevBg.paddingX ??
            prevBg.paddingY ??
            TIKTOK_BACKGROUND_PADDING;
          const nextBackground = {
            ...prevBg,
            ...patch.background,
            mode: (patch.background?.mode ??
              prevBg.mode ??
              TIKTOK_BACKGROUND_MODE) as "block" | "blob",
            color:
              patch.background?.color ??
              prevBg.color ??
              TIKTOK_BACKGROUND_COLOR,
            opacity: targetOpacity,
            enabled: patch.background?.enabled ?? targetOpacity > 0,
            paddingX: patch.background?.paddingX ?? fallbackPadding,
            paddingY:
              patch.background?.paddingY ?? prevBg.paddingY ?? fallbackPadding,
            radius:
              patch.background?.radius ??
              prevBg.radius ??
              TIKTOK_BACKGROUND_RADIUS,
            lineOverlap:
              patch.background?.lineOverlap ?? prevBg.lineOverlap ?? 0,
          };
          return { ...l, background: nextBackground };
        });
      }

      
      if (typeof patch.lineHeight === "number") {
        applyToActive((l) => ({ ...l, lineHeight: patch.lineHeight! }));
      }
      if (typeof patch.letterSpacing === "number") {
        applyToActive((l) => ({ ...l, letterSpacing: patch.letterSpacing! }));
      }
      if (patch.align) {
        applyToActive((l) => ({ ...l, align: patch.align as any }));
      }
      
      if (
        typeof (patch as any).fontSize === "number" &&
        Number.isFinite((patch as any).fontSize)
      ) {
        const nextScale = Math.max(
          0.2,
          Math.min(4, (patch as any).fontSize / BASE_FONT_PX),
        );
        applyToActive((l) => ({ ...l, scale: nextScale }));
      }

      
      if (typeof (patch as any).fill === "string") {
        const c = (patch as any).fill as string;
        applyToActive((l) => ({ ...l, color: c }));
      }
      if (typeof (patch as any).strokeWidth === "number") {
        const w = (patch as any).strokeWidth as number;
        applyToActive((l: any) => ({
          ...l,
          outlineEnabled: w > 0,
          outlineWidth: w,
        }));
      }
      if (typeof (patch as any).stroke === "string") {
        const c = (patch as any).stroke as string;
        applyToActive((l: any) => ({
          ...l,
          outlineEnabled: true,
          outlineColor: c,
          outlineWidth:
            l.outlineWidth && l.outlineWidth > 0
              ? l.outlineWidth
              : TIKTOK_OUTLINE_WIDTH,
        }));
      }
      if (typeof (patch as any).outlineWidth === "number") {
        const w = (patch as any).outlineWidth as number;
        applyToActive((l: any) => ({
          ...l,
          outlineEnabled: w > 0,
          outlineWidth: w,
        }));
      }
      if (typeof (patch as any).outlineColor === "string") {
        const c = (patch as any).outlineColor as string;
        applyToActive((l: any) => ({
          ...l,
          outlineEnabled: true,
          outlineColor: c,
          outlineWidth:
            l.outlineWidth && l.outlineWidth > 0
              ? l.outlineWidth
              : TIKTOK_OUTLINE_WIDTH,
        }));
      }

      
      if (typeof (patch as any).fontWeight === "string") {
        const isBold = ((patch as any).fontWeight as string) === "bold";
        applyToActive((l) => ({ ...l, weight: isBold ? "bold" : "regular" }));
      }
      
      if (typeof (patch as any).weight === "string") {
        const w = (patch as any).weight as any;
        applyToActive((l) => ({
          ...l,
          weight: w === "bold" ? "bold" : "regular",
        }));
      }
      if (typeof (patch as any).fontStyle === "string") {
        const isItalic = ((patch as any).fontStyle as string) === "italic";
        applyToActive((l: any) => ({ ...l, italic: isItalic }));
      }
    },
    [applyToActive],
  );

  
  const [uiBold, setUiBold] = useState(false);
  const [uiItalic, setUiItalic] = useState(false);
  const [uiAlign, setUiAlign] = useState<"left" | "center" | "right">("left");
  const [uiOutlineOn, setUiOutlineOn] = useState(true);
  const [uiScale, setUiScale] = useState<number>(1);
  const [uiLineHeight, setUiLineHeight] = useState<number>(1.12);
  const [uiOutlineWidth, setUiOutlineWidth] =
    useState<number>(TIKTOK_OUTLINE_WIDTH);
  const [uiTextColor, setUiTextColor] = useState<string>(TIKTOK_TEXT_COLOR);
  const [uiOutlineColor, setUiOutlineColor] =
    useState<string>(TIKTOK_OUTLINE_COLOR);

  const toggleBoldUI = () => {
    setUiBold((v) => !v);
    toggleBold();
  };
  const toggleItalicUI = () => {
    setUiItalic((v) => !v);
    toggleItalic();
  };
  const setAlignUI = (a: "left" | "center" | "right") => {
    setUiAlign(a);
    setAlign(a);
  };

  const handleToggleOutlineOn = (e: React.ChangeEvent<HTMLInputElement>) => {
    const on = e.currentTarget.checked;
    setUiOutlineOn(on);
    setUiOutlineWidth(on ? TIKTOK_OUTLINE_WIDTH : 0);
    applyToActive((l: any) => ({
      ...l,
      outlineEnabled: on,
      outlineWidth: on ? TIKTOK_OUTLINE_WIDTH : 0,
    }));
  };

  
  useEffect(() => {
    if (!active) return;
    const isBold = active.weight === "bold";
    const isItalic = !!(active as any).italic;
    setUiBold(isBold);
    setUiItalic(isItalic);
    setUiAlign(active.align ?? "left");
    setUiScale(Number.isFinite(active.scale) ? active.scale : 1);
    setUiLineHeight(active.lineHeight ?? 1.12);
    const outlineEnabled =
      (active as any).outlineEnabled ?? ((active as any).outlineWidth ?? 0) > 0;
    setUiOutlineOn(!!outlineEnabled);
    setUiOutlineWidth((active as any).outlineWidth ?? 0);
    setUiTextColor((active as any).color ?? TIKTOK_TEXT_COLOR);
    setUiOutlineColor((active as any).outlineColor ?? TIKTOK_OUTLINE_COLOR);
  }, [
    active?.id,
    active?.weight,
    (active as any)?.italic,
    active?.align,
    active?.scale,
    active?.lineHeight,
    (active as any)?.outlineEnabled,
    (active as any)?.outlineWidth,
    (active as any)?.color,
    (active as any)?.outlineColor,
    textLayers,
  ]);

  
  const handleScaleChange = (value: number) => {
    if (!Number.isFinite(value)) return;
    const s = Math.max(0.2, Math.min(4, value));
    setUiScale(s);
    setFontScale(s);
  };
  const handleLineHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.currentTarget.value);
    if (!Number.isFinite(v)) return;
    setUiLineHeight(v);
    applyToActive((l) => ({ ...l, lineHeight: v }));
  };
  const handleOutlineWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.currentTarget.value);
    if (!Number.isFinite(v)) return;
    setUiOutlineWidth(v);
    applyToActive((l) => ({ ...l, outlineEnabled: v > 0, outlineWidth: v }));
  };
  
  const setTextColorUI = (color: string) => {
    setUiTextColor(color);
    applyToActive((l) => ({ ...(l as any), color }));
  };
  const setOutlineColorUI = (color: string) => {
    setUiOutlineColor(color);
    applyToActive((l) => ({
      ...(l as any),
      outlineEnabled: true,
      outlineColor: color,
      outlineWidth:
        (l as any).outlineWidth && (l as any).outlineWidth > 0
          ? (l as any).outlineWidth
          : TIKTOK_OUTLINE_WIDTH,
    }));
  };

  return (
    <>
      {}
      {}
      <ToolbarSizedByCanvas wrapRef={wrapRef}>
        {showToolbar ? (
          <LegacyEditorToolbar
            onAddText={handleAddText}
            className="py-1 px-2"
            onToggleDim={() => setDimBg((v) => !v)}
            selectedText={
              active
                ? ({
                    id: active.id,
                    
                    
                    fontSize: Math.round(
                      BASE_FONT_PX *
                        (Number.isFinite(active.scale) ? active.scale : 1),
                    ),
                    lineHeight: active.lineHeight,
                    letterSpacing: active.letterSpacing,
                    align: active.align,
                    
                    
                    fill: (active as any).color ?? TIKTOK_TEXT_COLOR,
                    
                    stroke:
                      (active as any).outlineColor ?? TIKTOK_OUTLINE_COLOR,
                    outlineColor:
                      (active as any).outlineColor ?? TIKTOK_OUTLINE_COLOR,
                    strokeWidth: (active as any).outlineWidth ?? 0,
                    
                    fontWeight:
                      active.weight === "bold"
                        ? ("bold" as any)
                        : ("normal" as any),
                    fontStyle: (active as any).italic
                      ? ("italic" as any)
                      : ("normal" as any),
                    
                    background: active.background,
                  } as unknown as SlideTextElement)
                : null
            }
            onChangeSelectedText={handleToolbarPatch}
            onClose={onCloseToolbar}
          >
            {}

            {}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleBoldUI}
                aria-pressed={uiBold}
                className={
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium shadow-sm transition-colors " +
                  (uiBold
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-background/90 hover:bg-muted")
                }
                aria-label="Fett"
                title="Fett"
              >
                B
              </button>
              <button
                onClick={toggleItalicUI}
                aria-pressed={uiItalic}
                className={
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium shadow-sm transition-colors " +
                  (uiItalic
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-background/90 hover:bg-muted")
                }
                aria-label="Kursiv"
                title="Kursiv"
              >
                <span className="italic">I</span>
              </button>
            </div>

            {}
            <div
              className="flex items-center gap-2"
              aria-label="Textausrichtung"
            >
              <button
                aria-pressed={uiAlign === "left"}
                className={
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition-colors " +
                  (uiAlign === "left"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-background/90 hover:bg-muted")
                }
                aria-label="Links ausrichten"
                title="Links ausrichten"
                onClick={() => setAlignUI("left")}
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                aria-pressed={uiAlign === "center"}
                className={
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition-colors " +
                  (uiAlign === "center"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-background/90 hover:bg-muted")
                }
                aria-label="Zentrieren"
                title="Zentrieren"
                onClick={() => setAlignUI("center")}
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                aria-pressed={uiAlign === "right"}
                className={
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition-colors " +
                  (uiAlign === "right"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-background/90 hover:bg-muted")
                }
                aria-label="Rechts ausrichten"
                title="Rechts ausrichten"
                onClick={() => setAlignUI("right")}
              >
                <AlignRight className="h-4 w-4" />
              </button>
            </div>

            {}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Größe ×</label>
              <input
                type="number"
                step="0.05"
                min="0.2"
                max="4"
                value={uiScale}
                onChange={(e) =>
                  handleScaleChange(parseFloat(e.currentTarget.value))
                }
                className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm"
              />
            </div>

            {}
            <div className="basis-full h-0" />

            {}
            {}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">
                Zeilenhöhe
              </label>
              <input
                type="number"
                min="0.8"
                max="2"
                step="0.02"
                value={uiLineHeight}
                onChange={handleLineHeightChange}
                className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm"
              />
            </div>

            {}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Kontur an</label>
              <input
                type="checkbox"
                checked={uiOutlineOn}
                onChange={handleToggleOutlineOn}
                className="h-4 w-4 accent-primary"
              />
            </div>

            {}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">
                Konturbreite
              </label>
              <input
                type="range"
                min={0}
                max={TIKTOK_OUTLINE_WIDTH}
                step={0.5}
                value={uiOutlineWidth}
                onChange={handleOutlineWidthChange}
                disabled={!uiOutlineOn}
                className="h-1.5 w-32 accent-primary disabled:opacity-40"
              />
            </div>

            {}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Text</label>
              <input
                type="color"
                value={uiTextColor}
                onChange={(e) => setTextColorUI(e.currentTarget.value)}
                className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5"
              />
            </div>

            {}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Kontur</label>
              <input
                type="color"
                value={uiOutlineColor}
                onChange={(e) => setOutlineColorUI(e.currentTarget.value)}
                disabled={!uiOutlineOn}
                className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5 disabled:opacity-40"
              />
            </div>

            {}
          </LegacyEditorToolbar>
        ) : (
          
          <div className="w-full" />
        )}
      </ToolbarSizedByCanvas>

      {}
      <div
        ref={wrapRef}
        className="slide-shell relative mx-auto overflow-hidden border shadow-lg select-none bg-[#00B140]"
        style={{
          backgroundColor: "#00B140",
          width: previewSize.w,
          height: previewSize.h,
          aspectRatio: "9 / 16",
          touchAction: "none",
          userSelect: "none",
          
          pointerEvents: readOnly ? "none" : "auto",
        }}
        onPointerDown={onBGPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="absolute top-0 left-0"
          style={{
            width: W,
            height: H,
            transform: `scale(${scaleFactor})`,
            transformOrigin: "top left",
          }}
        >
          {imageUrl ? (
            <>
              <img
                ref={imgRef}
                src={imageUrl}
                alt=""
                className="absolute left-1/2 top-1/2 select-none pointer-events-none"
                style={{
                  width: imageNatural ? `${imageNatural.w}px` : "auto",
                  height: imageNatural ? `${imageNatural.h}px` : "auto",
                  transform: `translate(-50%,-50%) translate(${offset.x}px, ${offset.y}px) scale(${Math.max(
                    0.001,
                    scale,
                  )})`,
                  transformOrigin: "center",
                }}
                draggable={false}
                onLoad={(e) => {
                  try {
                    const n = e.currentTarget as HTMLImageElement;
                    setImageNatural({ w: n.naturalWidth, h: n.naturalHeight });
                    
                    const coverScale = Math.max(
                      W / n.naturalWidth,
                      H / n.naturalHeight,
                    );
                    setScale(coverScale);
                    
                    setOffset({ x: 0, y: 0 });
                  } catch {}
                }}
              />
              {}
              {false && bgSelected && imageNatural && (
                <div
                  className="absolute left-1/2 top-1/2 pointer-events-none"
                  style={{
                    transform: `translate(-50%,-50%) translate(${offset.x}px, ${offset.y}px) scale(${Math.max(
                      0.001,
                      scale,
                    )})`,
                    transformOrigin: "center",
                    width: imageNatural?.w ?? 0,
                    height: imageNatural?.h ?? 0,
                    boxSizing: "border-box",
                    border: "2px dashed rgba(59,130,246,0.9)",
                    borderRadius: "8px",
                  }}
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-black" />
          )}

          {}
          {dimBg && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: `rgba(0,0,0,${DIM_OVERLAY_OPACITY})` }}
            />
          )}

          {}
          {overlayNodes.map((node) => {
            const isActive = activeLayerId === node.id;
            const isGridImage = node.id.startsWith("canvas-grid-image-");

            
            if (isGridImage) {
              return (
                <div
                  key={node.id}
                  className="absolute"
                  style={{
                    left: node.x,
                    top: node.y,
                    width: node.width,
                    height: node.height,
                    overflow: "hidden",
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => onOverlayPointerDown(e, node)}
                  onPointerMove={onOverlayPointerMove}
                  onPointerUp={onOverlayPointerUp}
                >
                  <img
                    src={node.url}
                    alt=""
                    draggable={false}
                    className="select-none"
                    style={{
                      display: "block",
                      width: node.width + "px",
                      height: node.height + "px",
                      objectFit: "cover",
                      objectPosition: "center",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                  {isActive && (
                    <div
                      className="pointer-events-none"
                      style={{
                        position: "absolute",
                        inset: 0,
                        border: "2px dashed rgba(59,130,246,0.9)",
                        borderRadius: 8,
                      }}
                    />
                  )}
                </div>
              );
            }

            
            const nat = natSizeMap[node.id] || { w: 1, h: 1 };
            const fit = fitContain(node.width, node.height, nat.w, nat.h);
            const left = Math.round(fit.x);
            const top = Math.round(fit.y);
            const w = Math.round(fit.w);
            const h = Math.round(fit.h);

            return (
              <div
                key={node.id}
                className="absolute"
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: node.height,
                  overflow: "hidden",
                  touchAction: "none",
                }}
                onPointerDown={(e) => onOverlayPointerDown(e, node)}
                onPointerMove={onOverlayPointerMove}
                onPointerUp={onOverlayPointerUp}
              >
                <img
                  src={node.url}
                  alt=""
                  draggable={false}
                  className="select-none"
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width: w,
                    height: h,
                    objectFit: "contain",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />
                {isActive && (
                  <div
                    className="pointer-events-none"
                    style={{
                      position: "absolute",
                      inset: 0,
                      border: "2px dashed rgba(59,130,246,0.9)",
                      borderRadius: 8,
                    }}
                  />
                )}
              </div>
            );
          })}

          {textLayers.map((layer) => {
            const isActive = activeLayerId === layer.id;
            const isCurrentEditing = isEditing === layer.id;
            const cssFontWeight =
              layer.weight === "bold"
                ? 700
                : layer.weight === "semibold"
                  ? 600
                  : 400;
            const background = layer.background;
            
            const bgEnabled =
              (background?.enabled ?? false) || (background?.opacity ?? 0) > 0;
            const bgPadX = Math.max(
              0,
              background?.paddingX ?? TIKTOK_BACKGROUND_PADDING_X,
            );
            const bgPadY = Math.max(
              0,
              background?.paddingY ?? TIKTOK_BACKGROUND_PADDING_Y,
            );
            const bgRadius = Math.max(
              0,
              background?.radius ?? TIKTOK_BACKGROUND_RADIUS,
            );
            const bgColor = toCssColor(background?.color, background?.opacity);
            const bgMode = background?.mode ?? TIKTOK_BACKGROUND_MODE;

            return (
              <div key={layer.id}>
                {}
                <div
                  data-role="text-layer"
                  className={`absolute rounded-lg ${isActive ? "ring-2 ring-blue-500/80" : ""} ${isCurrentEditing ? "ring-2 ring-green-500/90" : ""} shadow-sm`}
                  style={{
                    left: layer.x,
                    top: layer.y,
                    transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
                    zIndex: layer.zIndex + 10,
                    cursor: isCurrentEditing ? "text" : "move",
                    width: layer.width,
                    height: layer.height,
                    boxSizing: "border-box",
                    padding: PADDING,
                    overflow: bgEnabled ? "visible" : "hidden",
                    background: isCurrentEditing
                      ? "rgba(0,0,0,0.04)"
                      : "transparent",
                  }}
                  onPointerDown={(e) => {
                    
                    if (isCurrentEditing) return;
                    
                    setBgSelected(false);
                    selectLayer(layer.id, e);
                  }}
                  onDoubleClick={() => onDoubleClick(layer.id)}
                >
                  {}
                  {isActive && !isCurrentEditing && (
                    <>
                      <div
                        className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-blue-400/70"
                        style={{ transform: "translateY(-0.5px)" }}
                      />
                      <div
                        className="pointer-events-none absolute left-0 right-0 bottom-0 h-px bg-blue-400/70"
                        style={{ transform: "translateY(0.5px)" }}
                      />
                      <div
                        className="pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-blue-400/70"
                        style={{ transform: "translateX(-0.5px)" }}
                      />
                      <div
                        className="pointer-events-none absolute top-0 bottom-0 right-0 w-px bg-blue-400/70"
                        style={{ transform: "translateX(0.5px)" }}
                      />
                    </>
                  )}

                  <div className="relative w-full h-full">
                    {isCurrentEditing ? (
                      <textarea
                        ref={(el) => {
                          if (isCurrentEditing) editorActiveRef.current = el;
                        }}
                        autoFocus
                        value={layer.content}
                        onChange={(e) => onTextareaChange(layer.id, e)}
                        onBlur={() => onTextBlur(layer.id)}
                        spellCheck={false}
                        className="relative z-10 outline-none w-full h-full"
                        style={{
                          resize: "none",
                          overflow: "auto",
                          userSelect: "text",
                          WebkitUserSelect: "text" as any,
                          background: "transparent",
                          color: layer.color,
                          fontSize: `${BASE_FONT_PX}px`,
                          fontFamily: layer.fontFamily ?? "Inter",
                          fontWeight: cssFontWeight as any,
                          fontStyle: (layer as any).italic
                            ? "italic"
                            : "normal",
                          lineHeight: bgEnabled ? 1.4 : layer.lineHeight, 
                          letterSpacing: `${layer.letterSpacing}px`,
                          textAlign: layer.align as any,
                          whiteSpace: "pre-wrap",
                          wordBreak: "normal",
                          overflowWrap: "normal",
                          boxSizing: "border-box",
                          fontKerning: "normal" as any,
                          
                          ...(bgEnabled ? {
                            padding: "0.2em 0.4em", 
                            borderRadius: bgMode === "blob" ? "0.45em" : "0.3em", 
                            backgroundColor: bgColor,
                          } : {}),
                          
                          textShadow:
                            (layer as any).outlineEnabled &&
                            ((layer as any).outlineWidth || 0) > 0
                              ? buildOuterTextShadow(
                                  Math.round(
                                    ((layer as any).outlineWidth || 6) *
                                      layer.scale,
                                  ),
                                  (layer as any).outlineColor || "#000",
                                ) + ", 0 2px 8px rgba(0,0,0,0.8)"
                              : "0 2px 8px rgba(0,0,0,0.8)",
                        }}
                      />
                    ) : (
                      <div
                        className="relative z-10 w-full h-full"
                        style={{
                          fontSize: `${BASE_FONT_PX}px`,
                          fontFamily: layer.fontFamily ?? "Inter",
                          fontWeight: cssFontWeight,
                          fontStyle: (layer as any).italic
                            ? "italic"
                            : "normal",
                          textAlign: layer.align,
                          lineHeight: bgEnabled ? 1.4 : layer.lineHeight, 
                          letterSpacing: `${layer.letterSpacing}px`,
                          whiteSpace: "pre-wrap",
                          wordBreak: "normal",
                          overflowWrap: "normal",
                          boxSizing: "border-box",
                          fontKerning: "normal" as any,
                        }}
                      >
                        <span
                          style={{
                            color: layer.color,
                            display: "inline",
                            
                            ...(bgEnabled ? {
                              background: bgColor,
                              padding: "0.2em 0.4em", 
                              borderRadius: bgMode === "blob" ? "0.45em" : "0.3em", 
                              boxDecorationBreak: "clone" as any,
                              WebkitBoxDecorationBreak: "clone" as any,
                            } : {}),
                            
                            textShadow:
                              (layer as any).outlineEnabled &&
                              ((layer as any).outlineWidth || 0) > 0
                                ? buildOuterTextShadow(
                                    Math.round(
                                      ((layer as any).outlineWidth || 6) *
                                        layer.scale,
                                    ),
                                    (layer as any).outlineColor || "#000",
                                  ) + ", 0 2px 8px rgba(0,0,0,0.8)"
                                : "0 2px 8px rgba(0,0,0,0.8)",
                          }}
                        >
                          {layer.content}
                        </span>
                      </div>
                    )}
                  </div>
                  {}
                  {isActive && !isCurrentEditing && (
                    <div
                      className="absolute inset-0 overflow-visible"
                      style={{ pointerEvents: "none", overflow: "visible" }}
                    >
                      {}
                      <div
                        data-role="handle"
                        title="Größe proportional ändern"
                        className="absolute top-0 left-0 w-7 h-7 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize flex items-center justify-center"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) =>
                          startResize(layer.id, "resize-nw", e)
                        }
                      >
                        <div className="h-8 w-8 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                      <div
                        data-role="handle"
                        title="Größe proportional ändern"
                        className="absolute top-0 right-0 w-7 h-7 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize flex items-center justify-center"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) =>
                          startResize(layer.id, "resize-ne", e)
                        }
                      >
                        <div className="h-8 w-8 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                      <div
                        data-role="handle"
                        title="Größe proportional ändern"
                        className="absolute bottom-0 left-0 w-7 h-7 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize flex items-center justify-center"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) =>
                          startResize(layer.id, "resize-sw", e)
                        }
                      >
                        <div className="h-8 w-8 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                      <div
                        data-role="handle"
                        title="Größe proportional ändern"
                        className="absolute bottom-0 right-0 w-7 h-7 translate-x-1/2 translate-y-1/2 cursor-nwse-resize flex items-center justify-center"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) =>
                          startResize(layer.id, "resize-se", e)
                        }
                      >
                        <div className="h-8 w-8 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>

                      {}
                      <div
                        data-role="handle"
                        title="Breite ändern (links)"
                        className="absolute left-0 top-1/2 w-12 h-24 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center z-[60]"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startResize(layer.id, "resize-left", e);
                        }}
                      >
                        <div className="h-16 w-[12px] rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                      <div
                        data-role="handle"
                        title="Breite ändern (rechts)"
                        className="absolute right-0 top-1/2 w-12 h-24 translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center z-[60]"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startResize(layer.id, "resize-right", e);
                        }}
                      >
                        <div className="h-16 w-[12px] rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                      <div
                        data-role="handle"
                        title="Höhe (oben)"
                        className="absolute top-0 left-1/2 w-28 h-10 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize flex items-center justify-center z-[60]"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startResize(layer.id, "resize-top", e);
                        }}
                      >
                        <div className="h-[12px] w-16 rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                      <div
                        data-role="handle"
                        title="Höhe (unten)"
                        className="absolute bottom-0 left-1/2 w-28 h-10 -translate-x-1/2 translate-y-1/2 cursor-ns-resize flex items-center justify-center z-[60]"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startResize(layer.id, "resize-bottom", e);
                        }}
                      >
                        <div className="h-[12px] w-16 rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="h-full w-full block"
            style={{ display: "none" }}
          />
        </div>

        {}
        {overlayContent && (
          <div className="absolute inset-0 z-50">{overlayContent}</div>
        )}
      </div>
      {}
    </>
  );
});

export default SlideCanvas;


function ToolbarSizedByCanvas({
  wrapRef,
  children,
}: {
  wrapRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const [maxW, setMaxW] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect?.width) setMaxW(Math.max(0, Math.floor(rect.width)));
    });
    ro.observe(el);
    
    setMaxW(el.getBoundingClientRect?.().width || undefined);
    return () => ro.disconnect();
  }, [wrapRef]);

  return (
    <div
      className="w-full bg-transparent mb-2"
      style={{
        display: "flex",
        justifyContent: "center",
        minHeight: "120px", 
      }}
    >
      <div
        className="mx-auto w-full"
        style={{
          maxWidth: maxW ?? "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
