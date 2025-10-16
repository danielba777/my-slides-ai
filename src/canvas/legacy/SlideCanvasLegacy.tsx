// apps/dashboard/src/app/(components)/SlideCanvas.tsx
"use client";

import {
  computeAutoHeight as computeAutoHeightFromUtil,
  measureWrappedText,
} from "@/lib/textMetrics";
import type { SlideTextElement } from "@/lib/types";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { GripVertical, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import LegacyEditorToolbar from "@/canvas/LegacyEditorToolbar";

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
};

export type SlideCanvasHandle = {
  getLayout: () => SlideTextElement[];
  exportPNG: () => Promise<Blob>;
};

type Props = {
  imageUrl: string; // "" = schwarz
  layout: SlideTextElement[];
  onLayoutChange: (next: SlideTextElement[]) => void;
};

const W = 1080;
const H = 1920;
const PADDING = 8;
const BASE_FONT_PX = 72;

// Export aspect ratio for responsive containers
export const ASPECT_RATIO = 9 / 16;

/** Build outer-only text outline via multiple text-shadows (no inner stroke) */
function buildOuterTextShadow(px: number, color: string): string {
  const r = Math.max(0, Math.round(px));
  if (r <= 0) return "none";
  const steps: string[] = [];
  // ring aus Offsets (Manhattan-Kreis + Diagonalen)
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y);
      if (d > 0 && d <= r + 0.01) steps.push(`${x}px ${y}px 0 ${color}`);
    }
  }
  // Fallback falls zu groß: cap bei 400 shadows
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

/** Helper: stabile Signatur für Layouts */
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
      // folgende drei sind optional, können in deinem types.ts fehlen -> runtime-optional
      it: (x as any).italic ?? false,
      oe: (x as any).outlineEnabled ?? false,
      ow: (x as any).outlineWidth ?? 6,
      oc: (x as any).outlineColor ?? "#000",
      tc: (x as any).color ?? "#ffffff",
    })),
  );
}

/** Fonts laden (wichtig, sonst variieren Messwerte) */
async function waitFontsReady() {
  try {
    const d: any = document;
    if (d?.fonts?.ready) await d.fonts.ready;
  } catch {}
}

/** Gemeinsame Text-Messfunktion - nutzt neue Utility für konsistente Ergebnisse */
function computeWrappedLinesWithDOM(
  layer: TextLayer & {
    italic?: boolean;
  },
): string[] {
  const weight =
    layer.weight === "bold" ? 700 : layer.weight === "semibold" ? 600 : 400;
  const scaledFontPx = BASE_FONT_PX * (layer.scale ?? 1);
  const lineHeightPx = scaledFontPx * (layer.lineHeight ?? 1.12);

  const result = measureWrappedText({
    text: String(layer.content ?? ""),
    fontFamily: layer.fontFamily ?? "Inter",
    fontWeight: weight,
    fontStyle: (layer as any).italic ? "italic" : "normal",
    fontSizePx: scaledFontPx,
    lineHeightPx,
    maxWidthPx: layer.width,
    letterSpacingPx: layer.letterSpacing ?? 0,
    whiteSpaceMode: "pre-wrap",
    wordBreakMode: "normal",
    paddingPx: PADDING,
  });

  return result.lines;
}

/** Höhe automatisch bestimmen (lokal) – nutzt ausschließlich die Utility */
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
  const scaledFontPx = BASE_FONT_PX * (layerBase.scale ?? 1);
  const lineHeightPx = scaledFontPx * (layerBase.lineHeight ?? 1.12);
  return computeAutoHeightFromUtil({
    text: String(layerBase.content ?? ""),
    fontFamily: layerBase.fontFamily ?? "Inter",
    fontWeight: weight,
    fontStyle: (layerBase as any).italic ? "italic" : "normal",
    fontSizePx: scaledFontPx,
    lineHeightPx,
    maxWidthPx: layerBase.width,
    letterSpacingPx: layerBase.letterSpacing ?? 0,
    whiteSpaceMode: "pre-wrap",
    wordBreakMode: "normal",
    width: layerBase.width,
    paddingPx: PADDING,
  });
}

/** Mapping: Props-Layout -> interne TextLayer (mit optionalen Editor-Feldern) */
function mapLayoutToLayers(layout: SlideTextElement[]): (TextLayer & {
  autoHeight?: boolean;
  italic?: boolean;
  outlineEnabled?: boolean;
  outlineWidth?: number;
  outlineColor?: string;
})[] {
  return layout.map((el, i) => {
    const id = el.id ?? `layer-${i}`;
    const tmp: TextLayer & {
      autoHeight?: boolean;
      italic?: boolean;
      outlineEnabled?: boolean;
      outlineWidth?: number;
      outlineColor?: string;
    } = {
      id,
      x: (el.x ?? 0.5) * W,
      y: (el.y ?? 0.5) * H,
      width: el.maxWidth ?? el.width ?? 400,
      height: (el as any).maxHeight ?? 0, // 0 = auto
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
      align: el.align ?? "left",
      color: (el as any).color ?? "#ffffff",
      content: el.content ?? "",
      zIndex: el.zIndex ?? i,
      italic: (el as any).italic ?? false,
      outlineEnabled: (el as any).outlineEnabled ?? false,
      outlineWidth: (el as any).outlineWidth ?? 6,
      outlineColor: (el as any).outlineColor ?? "#000",
    };

    if (!tmp.height || tmp.height <= 0) {
      // Auto-Höhe initial
      const lines = computeWrappedLinesWithDOM(tmp);
      tmp.height = Math.ceil(computeAutoHeightForLayer(tmp, lines));
      tmp.autoHeight = true;
    }

    return tmp;
  });
}

/** Mapping: interne TextLayer -> Props-Layout */
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
    // extra zurückgeben, falls Parent sie speichern möchte
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
  }));
}

const SlideCanvas = forwardRef<SlideCanvasHandle, Props>(function SlideCanvas(
  { imageUrl, layout, onLayoutChange },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // === Helpers: aktives/editiertes Layer finden & patchen ===
  const getActiveId = () => isEditingRef.current ?? activeLayerId;
  const applyToActive = (updater: (l: TextLayer) => TextLayer) => {
    const id = getActiveId();
    if (!id) return;
    setTextLayers(prev => prev.map(l => (l.id === id ? updater(l) : l)));
  };

  const toggleBold = () => {
    applyToActive(l => ({ ...l, weight: l.weight === "bold" ? "regular" : "bold" }));
  };
  const toggleItalic = () => {
    applyToActive(l => ({ ...l, italic: !(l as any).italic }));
  };
  const setAlign = (align: "left" | "center" | "right") => {
    applyToActive(l => ({ ...l, align }));
  };
  // Wir koppeln Schriftgröße an scale → BASE_FONT_PX \* scale
  const setFontScale = (scale: number) => {
    const s = Math.max(0.2, Math.min(4, Number.isFinite(scale) ? scale : 1));
    applyToActive(l => ({ ...l, scale: s }));
  };
  const setTextColor = (color: string) => {
    applyToActive(l => ({ ...l, color }));
  };
  const setOutlineColor = (color: string) => {
    applyToActive(l => ({ ...l, outlineEnabled: true, outlineColor: color }));
  };

  // === Text hinzufügen ===
  const addNewTextLayer = () => {
    const id = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `txt-${Date.now()}`;
    const centerX = W / 2;
    const centerY = H / 2;
    const initial: TextLayer & { autoHeight?: boolean } = {
      id,
      content: "Neuer Text",
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
      width: 600,
      height: 0, // auto
      zIndex: (textLayers.at(-1)?.zIndex ?? 0) + 1,
      color: "#ffffff",
      autoHeight: true,
    };
    const lines = computeWrappedLinesWithDOM(initial);
    initial.height = Math.ceil(computeAutoHeightForLayer(initial, lines));
    setTextLayers(prev => [...prev, initial]);
    setActiveLayerId(id);
    setIsEditing(id);
    // Cursor zurück in den Editor
    setTimeout(() => editorActiveRef.current?.focus(), 0);
  };

  // Reagiert auf globales "Text +"
  useEffect(() => {
  const handler = () => {
      addNewTextLayer();
       };
       window.addEventListener("canvas:add-text", handler);
       return () => window.removeEventListener("canvas:add-text", handler);
  }, []);

  // BG pan/zoom state (Canvas-Einheiten)
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  // Text layers — lokale Source of Truth
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

  // Edit / Interaction
  const [isEditing, setIsEditing] = useState<string | null>(null); // grüner Modus (Editor)
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

  // Prop-Sync Kontrolle
  const lastSentLayoutSigRef = useRef<string>("");
  const layoutSig = useMemo(() => layoutSignature(layout), [layout]);

  useEffect(() => {
    const fromParent =
      layoutSig !== lastSentLayoutSigRef.current &&
      !isInteracting.current &&
      !isEditingRef.current;
    if (fromParent) setTextLayers(mapLayoutToLayers(layout) as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutSig]);

  // Preview size
  const [previewSize, setPreviewSize] = useState({
    w: 420,
    h: Math.round(420 * (H / W)),
  });

  // Initial (einmal) setzen
  useEffect(() => {
    setTextLayers(mapLayoutToLayers(layout) as any);
    /* mount */
  }, []); // eslint-disable-line

  // Preview Box dynamisch anpassen
  useEffect(() => {
    function fit() {
      const parent = wrapRef.current?.parentElement;
      if (!parent) return;
      const containerWidth = parent.clientWidth;
      const w = Math.max(420, Math.min(containerWidth - 8, 540));
      setPreviewSize({ w, h: Math.round(w * (H / W)) });
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Cursor → Canvas-Koordinaten
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

  // === WHEEL: DOM-Listener mit passive:false, damit Seite NICHT scrollt ===
  const wheelHandler = useCallback((e: WheelEvent) => {
    if (isEditingRef.current) {
      // im Editor-Modus kein Pan/Zoom (Seite darf scrollen)
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (W / rect.width);
    const canvasY = (e.clientY - rect.top) * (H / rect.height);
    const factor = e.deltaY < 0 ? 1.06 : 0.94;

    setScale((prev) => {
      const newScale = Math.max(0.4, Math.min(3, prev * factor));
      const scaleDiff = newScale - prev;
      setOffset((o) => {
        const offsetX = ((canvasX - W / 2 - o.x) * scaleDiff) / prev;
        const offsetY = ((canvasY - H / 2 - o.y) * scaleDiff) / prev;
        return { x: o.x - offsetX, y: o.y - offsetY };
      });
      return newScale;
    });
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.addEventListener("wheel", wheelHandler, { passive: false });
    return () => el.removeEventListener("wheel", wheelHandler as any);
  }, [wheelHandler]);

  // BG pan
  const onBGPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    // 1) Klicks auf Text- oder Handle-Flächen: NICHT den Editor schließen
    if (
      target.closest('[data-role="text-layer"]') ||
      target.closest('[data-role="handle"]')
    ) {
      return;
    }
    // 2) Toolbar-Interaktionen: ebenfalls NICHT schließen
    if (toolbarMouseDownRef.current) {
      return;
    }
    // 3) ECHTER Hintergrundklick → Editor schließen + Pan erlauben
    if (isEditingRef.current) {
      setIsEditing(null);
    }
    isPanning.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onBGPointerMove = (e: React.PointerEvent) => {
    if (!isPanning.current || isInteracting.current) return;
    const dxPx = e.clientX - lastPoint.current.x;
    const dyPx = e.clientY - lastPoint.current.y;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    const rect = wrapRef.current!.getBoundingClientRect();
    const dx = dxPx * (W / rect.width);
    const dy = dyPx * (H / rect.height);
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };

  const onBGPointerUp = (e: React.PointerEvent) => {
    isPanning.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // GLOBAL pointerup → Interaktion beenden & Parent syncen
  useEffect(() => {
    const onWindowPointerUp = () => {
      if (!isInteracting.current) return;
      isInteracting.current = false;
      setDragMode(null);
      const newLayout = mapLayersToLayout(textLayers as any);
      const sig = layoutSignature(newLayout);
      lastSentLayoutSigRef.current = sig;
      onLayoutChange(newLayout);
    };
    window.addEventListener("pointerup", onWindowPointerUp);
    return () => window.removeEventListener("pointerup", onWindowPointerUp);
  }, [textLayers, onLayoutChange]);

  // Layer Interaktionen
  const selectLayer = (layerId: string, e: React.PointerEvent) => {
    if (isEditingRef.current === layerId) {
      // Im Editor-Modus: nichts blockieren, damit der Cursor/Selektion im Text funktioniert
      setActiveLayerId(layerId);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    setActiveLayerId(layerId);
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
      // Im Editor-Modus für diese Box: nicht resizen!
      e.stopPropagation();
      e.preventDefault();
      setActiveLayerId(layerId);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    setActiveLayerId(layerId);
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
          const s =
            1 +
            (mode === "resize-right" ? dx : -dx) /
              Math.max(1, layerStart.width);
          const width = Math.max(MIN_W, Math.round(layerStart.width * s));
          // Breite ändern → Auto-Höhe neu berechnen
          const temp = { ...l, width } as TextLayer & { autoHeight?: boolean };
          if (l.autoHeight) {
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
          }
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

          // Mindesthöhe basierend auf Content-Höhe sicherstellen
          const weight =
            l.weight === "bold" ? 700 : l.weight === "semibold" ? 600 : 400;
          const scaledFontPx = BASE_FONT_PX * l.scale;
          const lineHeightPx = scaledFontPx * (l.lineHeight ?? 1.12);

          const measureResult = measureWrappedText({
            text: String(l.content ?? ""),
            fontFamily: l.fontFamily ?? "Inter",
            fontWeight: weight,
            fontStyle: (l as any).italic ? "italic" : "normal",
            fontSizePx: scaledFontPx,
            lineHeightPx,
            maxWidthPx: l.width,
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

          // Manuelles Höhziehen deaktiviert Auto-Fit
          return { ...l, height, autoHeight: false };
        }

        const sign = {
          "resize-se": { sx: 1, sy: 1 },
          "resize-ne": { sx: 1, sy: -1 },
          "resize-sw": { sx: -1, sy: 1 },
          "resize-nw": { sx: -1, sy: -1 },
        } as const;
        const { sx, sy } = sign[mode as keyof typeof sign];
        const sxFactor = 1 + (sx * dx) / Math.max(1, layerStart.width);
        const syFactor = 1 + (sy * dy) / Math.max(1, layerStart.height);
        let s = (sxFactor + syFactor) / 2;
        s = Math.max(0.05, s);

        let nextW = layerStart.width * s;
        let nextH = layerStart.height * s;
        if (nextW < MIN_W) nextW = MIN_W;
        if (nextH < MIN_H) nextH = MIN_H;

        const nextScale = Math.max(MIN_SCALE, layerStart.scale * s);

        const temp = {
          ...l,
          width: Math.round(nextW),
          height: Math.round(nextH),
          scale: nextScale,
          fontSize: BASE_FONT_PX * nextScale,
        } as TextLayer & { autoHeight?: boolean };

        if (l.autoHeight) {
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
        }
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
    onLayoutChange(newLayout);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Edit-Modus
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
    // Wenn die Toolbar geklickt wurde, Editor NICHT schließen – stattdessen zurückfokussieren
    if (toolbarMouseDownRef.current) {
      setTimeout(() => editorActiveRef.current?.focus(), 0);
      return;
    }
    setIsEditing(null);
    const newLayout = mapLayersToLayout(textLayers as any);
    const sig = layoutSignature(newLayout);
    lastSentLayoutSigRef.current = sig;
    onLayoutChange(newLayout);
  };

  // Delete/Entf Taste: selektierten Text-Layer löschen
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Delete/Entf Taste nur behandeln wenn:
      // 1. Ein Layer selektiert ist
      // 2. Kein Eingabefeld (Textarea/Input) fokussiert ist
      // 3. Nicht im Editiermodus
      if (
        (e.key === "Delete" || (e.key === "Backspace" && e.metaKey)) &&
        activeLayerId &&
        isEditingRef.current === null &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        e.preventDefault();
        e.stopPropagation();

        setTextLayers((prev) => {
          const updated = prev.filter((l) => l.id !== activeLayerId);
          const newLayout = mapLayersToLayout(updated as any);
          const sig = layoutSignature(newLayout);
          lastSentLayoutSigRef.current = sig;
          onLayoutChange(newLayout);
          setActiveLayerId(null);
          return updated;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeLayerId, onLayoutChange]);

  // Debounced Parent-Sync
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
        onLayoutChange(newLayout);
      }
    }, 100);
    return () =>
      layoutChangeTimeoutRef.current &&
      clearTimeout(layoutChangeTimeoutRef.current);
  }, [textLayers, onLayoutChange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Export PNG — 1:1 wie Preview + Outline
  const exportPNG = useCallback(async (): Promise<Blob> => {
    await waitFontsReady();

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = W;
    canvas.height = H;

    // BG
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // === NEU: Hintergrundbild exakt wie in der Preview zeichnen ===
    // Preview verwendet: translate(-50%,-50%) + translate(offset) + scale(scale) um das Bildzentrum
    // Wir spiegeln das fürs Canvas:
    const img = imgRef.current;
    if (imageUrl && img && img.naturalWidth && img.naturalHeight) {
      ctx.save();
      // gleiche Matrix wie in der Preview: ins Zentrum + Pan + Zoom
      ctx.translate(W / 2 + offset.x, H / 2 + offset.y);
      ctx.scale(Math.max(0.001, scale), Math.max(0.001, scale));
      // Bild um sein Zentrum zeichnen
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      ctx.drawImage(img, -iw / 2, -ih / 2);
      ctx.restore();
    }
    // === ENDE NEU ===

    // Text
    const sorted = [...textLayers].sort((a, b) => a.zIndex - b.zIndex);
    for (const layer of sorted) {
      if (!layer.content) continue;

      const lines = computeWrappedLinesWithDOM(layer as any);
      const weight =
        layer.weight === "bold" ? 700 : layer.weight === "semibold" ? 600 : 400;
      const scaledFontPx = BASE_FONT_PX * layer.scale;
      const italic = (layer as any).italic;
      const layerHeight =
        layer.height && layer.height > 0
          ? layer.height
          : Math.max(
              1,
              Math.ceil(
                computeAutoHeightForLayer(
                  { ...layer, italic: (layer as any).italic },
                  lines,
                ),
              ),
            );

      ctx.save();
      ctx.translate(layer.x, layer.y);
      ctx.rotate((layer.rotation * Math.PI) / 180);

      // Clip exakt auf die Box inkl. Padding
      const boxLeft = -layer.width / 2;
      const boxTop = -layerHeight / 2;
      ctx.beginPath();
      ctx.rect(boxLeft, boxTop, layer.width, layerHeight);
      ctx.clip();

      const contentWidth = Math.max(0, layer.width - 2 * PADDING);
      const contentHeight = Math.max(0, layerHeight - 2 * PADDING);

      ctx.font = `${italic ? "italic " : ""}${weight} ${scaledFontPx}px ${layer.fontFamily}`;
      (ctx as any).fontKerning = "normal";
      ctx.fillStyle = layer.color;
      ctx.textBaseline = "alphabetic";

      const lineHeightPx = scaledFontPx * layer.lineHeight;
      const startYTop = boxTop + PADDING + lineHeightPx;
      let y = startYTop;

      const outlineEnabled = (layer as any).outlineEnabled;
      const outlineWidth = (layer as any).outlineWidth ?? 6;
      const outlineColor = (layer as any).outlineColor ?? "#000";

      // Hilfsfunktionen
      const perGlyph = (
        cb: (ch: string, x: number, y: number) => void,
        text: string,
        startX: number,
        y: number,
      ) => {
        let x = startX;
        for (const ch of text) {
          cb(ch, x, y);
          x += ctx.measureText(ch).width + layer.letterSpacing;
        }
      };

      const drawOuterStrokeLine = (raw: string, yPos: number) => {
        if (!(outlineEnabled && outlineWidth > 0)) return;
        // Offscreen in Größe der Textbox (inkl. Padding-Content-Bereich)
        const off = document.createElement("canvas");
        off.width = Math.max(1, Math.ceil(layer.width));
        off.height = Math.max(1, Math.ceil(layerHeight));
        const ox = off.getContext("2d")!;
        ox.font = ctx.font;
        ox.textBaseline = "alphabetic";
        (ox as any).fontKerning = "normal";

        // Lokale Koordinaten (Offscreen-Canvas hat Ursprung an der BOX-Links-/Oberkante)
        const baseLeft = -layer.width / 2;
        const baseTop = -layerHeight / 2;
        const textW = Math.max(0, layer.width - 2 * PADDING);
        // Start an Contentkante inkl. PADDING ausrichten (wie im Preview)
        let startX = baseLeft + PADDING;
        if (layer.align === "center") startX = baseLeft + PADDING + textW / 2;
        else if (layer.align === "right") startX = baseLeft + PADDING + textW;
        const localX = startX - baseLeft; // -> PADDING | PADDING+textW/2 | PADDING+textW
        const localY = yPos - baseTop;

        // 1) Stroke (alles) zeichnen
        ox.lineJoin = "round";
        ox.miterLimit = 2;
        ox.strokeStyle = outlineColor;
        // Canvas-Stroke entspricht außen effektiv ~lineWidth/2.
        // Für Parität zum CSS-Preview (Radius r) setzen wir 2*r:
        ox.lineWidth = 2 * (outlineWidth * layer.scale);

        if (layer.letterSpacing === 0) {
          // ganze Zeile
          if (layer.align === "left") ox.textAlign = "left";
          else if (layer.align === "right") ox.textAlign = "right";
          else ox.textAlign = "center";
          ox.strokeText(raw, localX, localY);
        } else {
          // per Glyph
          perGlyph(
            (ch, x, yy) => {
              ox.strokeText(ch, x - baseLeft, yy - baseTop);
            },
            raw,
            startX,
            yPos,
          );
        }

        // 2) Innenanteil subtrahieren
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
              ox.fillText(ch, x - baseLeft, yy - baseTop);
            },
            raw,
            startX,
            yPos,
          );
        }
        ox.globalCompositeOperation = "source-over";

        // 3) Offscreen auf Main einblenden (an Box-Position)
        ctx.drawImage(off, -layer.width / 2, -layerHeight / 2);
      };

      const drawFillLine = (raw: string, yPos: number) => {
        const textW = Math.max(0, layer.width - 2 * PADDING);
        // Soft Shadow wie im Preview: "0 2px 8px rgba(0,0,0,0.8)"
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 8;
        if (layer.letterSpacing === 0) {
          if (layer.align === "left") {
            ctx.textAlign = "left";
            ctx.fillText(raw, -layer.width / 2 + PADDING, yPos);
          } else if (layer.align === "right") {
            ctx.textAlign = "right";
            ctx.fillText(raw, -layer.width / 2 + PADDING + textW, yPos);
          } else {
            ctx.textAlign = "center";
            ctx.fillText(raw, -layer.width / 2 + PADDING + textW / 2, yPos);
          }
        } else {
          let visualWidth = 0;
          for (const ch of raw) visualWidth += ctx.measureText(ch).width;
          if (raw.length > 1)
            visualWidth += layer.letterSpacing * (raw.length - 1);
          let startX: number;
          if (layer.align === "left") startX = -layer.width / 2 + PADDING;
          else if (layer.align === "right")
            startX = -layer.width / 2 + PADDING + textW - visualWidth;
          else startX = -layer.width / 2 + PADDING + (textW - visualWidth) / 2;
          perGlyph((ch, x, yy) => ctx.fillText(ch, x, yy), raw, startX, yPos);
        }
        ctx.restore();
      };

      for (const raw of lines) {
        if (y - (boxTop + PADDING) > contentHeight + 1) break;
        // Outline außen-only
        drawOuterStrokeLine(raw, y);
        // Normales Füllen
        drawFillLine(raw, y);
        y += lineHeightPx;
      }

      ctx.restore();
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/png",
      );
    });
  }, [textLayers, imageUrl, scale, offset]);

  useImperativeHandle(
    ref,
    () => ({
      getLayout: () => mapLayersToLayout(textLayers as any),
      exportPNG,
    }),
    [textLayers, exportPNG],
  );

  // Render
  const scaleFactor = previewSize.w / W;
  const active = textLayers.find((l) => l.id === activeLayerId) as
    | (TextLayer & {
        italic?: boolean;
        outlineEnabled?: boolean;
        outlineWidth?: number;
        outlineColor?: string;
      })
    | undefined;
  const toolbarActive = !!isEditing;

  const handleAddText = useCallback(() => {
    addNewTextLayer();
  }, [textLayers]);

  // --- UI-States: werden aus dem aktiven Layer gespiegelt ---
  const [uiBold, setUiBold] = useState(false);
  const [uiItalic, setUiItalic] = useState(false);
  const [uiAlign, setUiAlign] = useState<"left" | "center" | "right">("left");
  const [uiOutlineOn, setUiOutlineOn] = useState(true);
  const [uiScale, setUiScale] = useState<number>(1);
  const [uiLineHeight, setUiLineHeight] = useState<number>(1.12);
  const [uiOutlineWidth, setUiOutlineWidth] = useState<number>(6);
  const [uiTextColor, setUiTextColor] = useState<string>("#ffffff");
  const [uiOutlineColor, setUiOutlineColor] = useState<string>("#000000");

  const toggleBoldUI = () => { setUiBold(v => !v); toggleBold(); };
  const toggleItalicUI = () => { setUiItalic(v => !v); toggleItalic(); };
  const setAlignUI = (a: "left" | "center" | "right") => { setUiAlign(a); setAlign(a); };

  const handleToggleOutlineOn = (e: React.ChangeEvent<HTMLInputElement>) => {
    const on = e.currentTarget.checked;
    setUiOutlineOn(on);
    applyToActive((l: any) => ({
      ...l,
      outlineEnabled: on,
      // Falls eingeschaltet aber Breite 0, kleinen Default setzen:
      outlineWidth: on ? (l.outlineWidth && l.outlineWidth > 0 ? l.outlineWidth : 4) : 0,
    }));
  };

  // Werte synchronisieren, wenn aktiver Layer wechselt oder verändert wird
  useEffect(() => {
    if (!active) return;
    const isBold = active.weight === "bold";
    const isItalic = !!(active as any).italic;
    setUiBold(isBold);
    setUiItalic(isItalic);
    setUiAlign(active.align ?? "left");
    setUiScale(Number.isFinite(active.scale) ? active.scale : 1);
    setUiLineHeight(active.lineHeight ?? 1.12);
    const outlineEnabled = (active as any).outlineEnabled ?? ((active as any).outlineWidth ?? 0) > 0;
    setUiOutlineOn(!!outlineEnabled);
    setUiOutlineWidth((active as any).outlineWidth ?? 0);
    setUiTextColor((active as any).color ?? "#ffffff");
    setUiOutlineColor((active as any).outlineColor ?? "#000000");
  }, [active?.id, active?.weight, (active as any)?.italic, active?.align, active?.scale, active?.lineHeight, (active as any)?.outlineEnabled, (active as any)?.outlineWidth, (active as any)?.color, (active as any)?.outlineColor, textLayers]);

  // Änderungen aus Inputs -> Layer + UI-State spiegeln
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
    applyToActive(l => ({ ...l, lineHeight: v }));
  };
  const handleOutlineWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.currentTarget.value);
    if (!Number.isFinite(v)) return;
    setUiOutlineWidth(v);
    applyToActive(l => ({ ...l, outlineEnabled: v > 0, outlineWidth: v }));
  };
  // UI-Handler klar benennen, um Namenskollisionen mit den Canvas-Actions zu vermeiden
  const setTextColorUI = (color: string) => {
    setUiTextColor(color);
    applyToActive(l => ({ ...(l as any), color }));
  };
  const setOutlineColorUI = (color: string) => {
    setUiOutlineColor(color);
    applyToActive(l => ({ ...(l as any), outlineEnabled: true, outlineColor: color }));
  };

  return (
    <>
      {/* Obere Toolbar (immer sichtbar) */}
      <div
        className="sticky top-0 z-50 w-full bg-transparent flex justify-center"
      >
        {/* Die Toolbar-Box selbst: auto-breit, mittig */}
        <LegacyEditorToolbar
          onAddText={handleAddText}
          className="py-1 px-2 inline-flex w-fit max-w-full items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70 flex-wrap mx-auto"
        >

        {/* === BEGIN: LEGACY CONTROLS (NEU ANGERICHTET) === */}

        {/* --- ZEILE 1: Typo & Ausrichtung & Größe --- */}
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
           >B</button>
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

        {/* Ausrichtung mit "mehrzeiligen" Icons */}
        <div className="flex items-center gap-2" aria-label="Textausrichtung">
          <button
            aria-pressed={uiAlign === "left"}
            className={
              "inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition-colors " +
              (uiAlign === "left"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/80 bg-background/90 hover:bg-muted")
            }
            aria-label="Links ausrichten" title="Links ausrichten"
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
            aria-label="Zentrieren" title="Zentrieren"
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
            aria-label="Rechts ausrichten" title="Rechts ausrichten"
            onClick={() => setAlignUI("right")}
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>

        {/* Größe × (Scale) */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Größe ×</label>
          <input
            type="number"
            step="0.05"
            min="0.2"
            max="4"
            value={uiScale}
            onChange={(e) => handleScaleChange(parseFloat(e.currentTarget.value))}
            className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm"
          />
        </div>

        {/* Zeilenumbruch zu Zeile 2 */}
        <div className="basis-full h-0" />

        {/* --- ZEILE 2: Abstände & Farben --- */}
        {/* Zeilenhöhe (Input) */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Zeilenhöhe</label>
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

        {/* Kontur-Schalter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Kontur an</label>
          <input
            type="checkbox"
            checked={uiOutlineOn}
            onChange={handleToggleOutlineOn}
            className="h-4 w-4 accent-primary"
          />
        </div>

        {/* Konturbreite (Slider) */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Konturbreite</label>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={uiOutlineWidth}
            onChange={handleOutlineWidthChange}
            disabled={!uiOutlineOn}
            className="h-1.5 w-32 accent-primary disabled:opacity-40"
          />
        </div>

        {/* Textfarbe */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Text</label>
          <input
            type="color"
            value={uiTextColor}
            onChange={(e) => setTextColorUI(e.currentTarget.value)}
            className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5"
          />
        </div>

        {/* Konturfarbe */}
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

        {/* === END: LEGACY CONTROLS === */}
        </LegacyEditorToolbar>
      </div>

      {/* Canvas-Shell */}
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
            <img
              ref={imgRef}
              src={imageUrl}
              alt=""
              className="absolute left-1/2 top-1/2 select-none pointer-events-none"
              style={{
                transform: `translate(-50%,-50%) translate(${offset.x}px, ${offset.y}px) scale(${Math.max(
                  0.001,
                  scale
                )})`,
                transformOrigin: "center",
              }}
              draggable={false} />
          ) : (
            <div className="absolute inset-0 bg-black" />
          )}

          {textLayers.map((layer) => {
            const isActive = activeLayerId === layer.id;
            const isCurrentEditing = isEditing === layer.id;
            const cssFontWeight = layer.weight === "bold"
              ? 700
              : layer.weight === "semibold"
                ? 600
                : 400;

            return (
              <div key={layer.id}>
                {/* TEXT-BOX (border-box) */}
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
                    overflow: "hidden",
                    background: isCurrentEditing
                      ? "rgba(0,0,0,0.04)"
                      : "transparent",
                  }}
                  onPointerDown={(e) => {
                    // Im Editor-Modus keine Pointer-Blockade → Mausplatzierung/Markieren funktioniert
                    if (isCurrentEditing) return;
                    selectLayer(layer.id, e);
                  } }
                  onDoubleClick={() => onDoubleClick(layer.id)}
                >
                  {/* === Edge guide lines that follow the box (inside the same transform) === */}
                  {isActive && !isCurrentEditing && (
                    <>
                      <div
                        className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-blue-400/70"
                        style={{ transform: "translateY(-0.5px)" }} />
                      <div
                        className="pointer-events-none absolute left-0 right-0 bottom-0 h-px bg-blue-400/70"
                        style={{ transform: "translateY(0.5px)" }} />
                      <div
                        className="pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-blue-400/70"
                        style={{ transform: "translateX(-0.5px)" }} />
                      <div
                        className="pointer-events-none absolute top-0 bottom-0 right-0 w-px bg-blue-400/70"
                        style={{ transform: "translateX(0.5px)" }} />
                    </>
                  )}

                  {isCurrentEditing ? (
                    <textarea
                      ref={(el) => {
                        if (isCurrentEditing) editorActiveRef.current = el;
                      } }
                      autoFocus
                      value={layer.content}
                      onChange={(e) => onTextareaChange(layer.id, e)}
                      onBlur={() => onTextBlur(layer.id)}
                      spellCheck={false}
                      className="outline-none w-full h-full"
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
                        fontStyle: (layer as any).italic ? "italic" : "normal",
                        lineHeight: layer.lineHeight,
                        letterSpacing: `${layer.letterSpacing}px`,
                        textAlign: layer.align as any,
                        whiteSpace: "pre-wrap",
                        wordBreak: "normal",
                        overflowWrap: "normal",
                        boxSizing: "border-box",
                        fontKerning: "normal" as any,
                        /* nur außen: Outline-Ring + bestehender Soft-Shadow kombiniert */
                        textShadow: (layer as any).outlineEnabled &&
                          ((layer as any).outlineWidth || 0) > 0
                          ? buildOuterTextShadow(
                            Math.round(
                              ((layer as any).outlineWidth || 6) *
                              layer.scale
                            ),
                            (layer as any).outlineColor || "#000"
                          ) + ", 0 2px 8px rgba(0,0,0,0.8)"
                          : "0 2px 8px rgba(0,0,0,0.8)",
                      }} />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{
                        color: layer.color,
                        fontSize: `${BASE_FONT_PX}px`,
                        fontFamily: layer.fontFamily ?? "Inter",
                        fontWeight: cssFontWeight,
                        fontStyle: (layer as any).italic ? "italic" : "normal",
                        textAlign: layer.align,
                        lineHeight: layer.lineHeight,
                        letterSpacing: `${layer.letterSpacing}px`,
                        whiteSpace: "pre-wrap",
                        wordBreak: "normal",
                        overflowWrap: "normal",
                        boxSizing: "border-box",
                        fontKerning: "normal" as any,
                        /* nur außen: Outline-Ring + bestehender Soft-Shadow kombiniert */
                        textShadow: (layer as any).outlineEnabled &&
                          ((layer as any).outlineWidth || 0) > 0
                          ? buildOuterTextShadow(
                            Math.round(
                              ((layer as any).outlineWidth || 6) *
                              layer.scale
                            ),
                            (layer as any).outlineColor || "#000"
                          ) + ", 0 2px 8px rgba(0,0,0,0.8)"
                          : "0 2px 8px rgba(0,0,0,0.8)",
                      }}
                    >
                      {layer.content}
                    </div>
                  )}

                  {/* === Handles INSIDE the box so they inherit rotation/scale and stay attached === */}
                  {isActive && !isCurrentEditing && (
                    <div
                      className="absolute inset-0"
                      style={{ pointerEvents: "none" }}
                    >
                      {/* Corners: großer klickbarer Wrapper, kleiner sichtbarer Punkt */}
                      <div
                        data-role="handle"
                        title="Größe (proportional + Text)"
                        className="absolute top-0 left-0 w-5 h-5 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize flex items-center justify-center"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) => startResize(layer.id, "resize-nw", e)}
                      >
                        <div className="h-3 w-3 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                      <div
                        data-role="handle"
                        title="Größe (proportional + Text)"
                        className="absolute top-0 right-0 w-5 h-5 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize flex items-center justify-center"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) => startResize(layer.id, "resize-ne", e)}
                      >
                        <div className="h-3 w-3 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                      <div
                        data-role="handle"
                        title="Größe (proportional + Text)"
                        className="absolute bottom-0 left-0 w-5 h-5 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize flex items-center justify-center"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) => startResize(layer.id, "resize-sw", e)}
                      >
                        <div className="h-3 w-3 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                      <div
                        data-role="handle"
                        title="Größe (proportional + Text)"
                        className="absolute bottom-0 right-0 w-5 h-5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize flex items-center justify-center"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) => startResize(layer.id, "resize-se", e)}
                      >
                        <div className="h-3 w-3 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>

                      {/* Sides: großer klickbarer Wrapper, schmaler sichtbarer Balken */}
                      <div
                        data-role="handle"
                        title="Breite (links)"
                        className="absolute left-0 top-1/2 w-5 h-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) => startResize(layer.id, "resize-left", e)}
                      >
                        <div className="h-6 w-2 rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                      <div
                        data-role="handle"
                        title="Breite (rechts)"
                        className="absolute right-0 top-1/2 w-5 h-8 translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) => startResize(layer.id, "resize-right", e)}
                      >
                        <div className="h-6 w-2 rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                      <div
                        data-role="handle"
                        title="Höhe (oben)"
                        className="absolute top-0 left-1/2 w-8 h-5 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize flex items-center justify-center"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) => startResize(layer.id, "resize-top", e)}
                      >
                        <div className="h-2 w-6 rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                      </div>
                      <div
                        data-role="handle"
                        title="Höhe (unten)"
                        className="absolute bottom-0 left-1/2 w-8 h-5 -translate-x-1/2 translate-y-1/2 cursor-ns-resize flex items-center justify-center"
                        style={{ pointerEvents: "auto" }}
                        onPointerDown={(e) => startResize(layer.id, "resize-bottom", e)}
                      >
                        <div className="h-2 w-6 rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
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
            style={{ display: "none" }} />
        </div>
      </div>
      {/* ^ obere Canvas-Hülle */}
      </>
  );
});

export default SlideCanvas;
