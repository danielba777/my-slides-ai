"use client";

import LegacySlideCanvas from "@/canvas/legacy/SlideCanvasLegacy";
import type { SlideTextElement } from "@/lib/types";
import { useCallback, useMemo } from "react";

// Falls du einen eigenen Typ hast, importiere ihn hier:
// import type { CanvasDoc } from "@/lib/canvasTypes";

type CanvasDoc = {
  nodes: Array<
    | {
        id?: string;
        type: "image";
        url?: string;
        // optional weitere Felder...
      }
    | {
        id?: string;
        type: "text";
        x?: number; // absolute px oder normiert? → wir behandeln beides robust
        y?: number;
        width?: number; // px
        height?: number; // px
        rotation?: number;
        fontFamily?: string;
        fontSize?: number; // px (Basis 72 im Legacy)
        lineHeight?: number; // z. B. 1.12
        letterSpacing?: number; // px
        weight?: "regular" | "semibold" | "bold" | "normal";
        align?: "left" | "center" | "right";
        color?: string;
        italic?: boolean;
        outlineEnabled?: boolean;
        outlineWidth?: number;
        outlineColor?: string;
        content?: string;
        zIndex?: number;
        // Falls normiert gespeichert:
        nx?: number; // 0..1
        ny?: number; // 0..1
        nmaxWidth?: number; // normiert auf W?
      }
  >;
};

const W = 1080;
const H = 1920;
const BASE_FONT_PX = 72;

function normToPxX(v: number | undefined) {
  if (v == null) return undefined;
  // Heuristik: wenn 0..1 → normiert
  return v >= 0 && v <= 1 ? Math.round(v * W) : Math.round(v);
}
function normToPxY(v: number | undefined) {
  if (v == null) return undefined;
  return v >= 0 && v <= 1 ? Math.round(v * H) : Math.round(v);
}

function pxToNormX(v: number | undefined) {
  return v == null ? undefined : v / W;
}
function pxToNormY(v: number | undefined) {
  return v == null ? undefined : v / H;
}

type Props = {
  doc: CanvasDoc;
  onChange: (next: CanvasDoc) => void;
};

export default function SlideCanvasAdapter({ doc, onChange }: Props) {
  const imageUrl = useMemo(() => {
    const img = doc.nodes.find((n) => (n as any).type === "image") as
      | any
      | undefined;
    return img?.url || "";
  }, [doc]);

  const layout = useMemo<SlideTextElement[]>(() => {
    const texts = doc.nodes.filter((n) => (n as any).type === "text") as any[];
    return texts.map((t, i) => {
      // Positionslogik: nx/ny (normiert) > x/y (px)
      const xPx = normToPxX(t.nx ?? t.x) ?? Math.round(W * 0.5);
      const yPx = normToPxY(t.ny ?? t.y) ?? Math.round(H * 0.5);

      // scale aus fontSize ableiten (Basis 72px)
      const scale =
        typeof t.fontSize === "number" && t.fontSize > 0
          ? t.fontSize / BASE_FONT_PX
          : 1;

      // Gewicht mappen
      const weight =
        t.weight === "bold"
          ? "bold"
          : t.weight === "semibold"
            ? "semibold"
            : "regular";

      return {
        content: t.content ?? "",
        x: xPx / W,
        y: yPx / H,
        rotation: t.rotation ?? 0,
        scale,
        maxWidth: t.width ?? 400,
        ...(t.height ? { maxHeight: t.height } : {}),
        lineHeight: t.lineHeight ?? 1.12,
        letterSpacing: t.letterSpacing ?? 0,
        zIndex: t.zIndex ?? i,
        align: (t.align as any) ?? "left",
        weight,
        // Extras (optional unterstützt vom Legacy-Canvas):
        ...(t.italic !== undefined ? { italic: t.italic } : {}),
        ...(t.outlineEnabled !== undefined
          ? { outlineEnabled: t.outlineEnabled }
          : {}),
        ...(t.outlineWidth !== undefined
          ? { outlineWidth: t.outlineWidth }
          : {}),
        ...(t.outlineColor !== undefined
          ? { outlineColor: t.outlineColor }
          : {}),
        ...(t.color !== undefined ? { color: t.color } : {}),
      } as SlideTextElement;
    });
  }, [doc]);

  const handleLayoutChange = useCallback(
    (next: SlideTextElement[]) => {
      // Text-Nodes im doc anhand Reihenfolge/Zuweisung updaten
      const newNodes = doc.nodes.map((n) => ({ ...n }));
      let ti = 0;
      for (let i = 0; i < newNodes.length; i++) {
        const n: any = newNodes[i];
        if (n.type !== "text") continue;
        const src = next[ti++];
        if (!src) break;

        const pxX = Math.round((src.x ?? 0.5) * W);
        const pxY = Math.round((src.y ?? 0.5) * H);

        n.x = pxX;
        n.y = pxY;
        n.nx = pxToNormX(pxX);
        n.ny = pxToNormY(pxY);
        n.rotation = src.rotation ?? 0;
        n.scale = src.scale ?? 1;
        n.fontSize = Math.round(BASE_FONT_PX * (src.scale ?? 1));
        n.width = src.maxWidth ?? n.width ?? 400;
        n.height = (src as any).maxHeight ?? n.height; // wenn autoHeight, bleibt evtl. undefined
        n.lineHeight = src.lineHeight ?? 1.12;
        n.letterSpacing = src.letterSpacing ?? 0;
        n.zIndex = src.zIndex ?? n.zIndex ?? 0;
        n.align = src.align ?? "left";
        n.weight =
          src.weight === "bold"
            ? "bold"
            : src.weight === "semibold"
              ? "semibold"
              : "regular";
        n.content = src.content ?? n.content ?? "";

        // Extras
        if ((src as any).italic !== undefined) n.italic = (src as any).italic;
        if ((src as any).outlineEnabled !== undefined)
          n.outlineEnabled = (src as any).outlineEnabled;
        if ((src as any).outlineWidth !== undefined)
          n.outlineWidth = (src as any).outlineWidth;
        if ((src as any).outlineColor !== undefined)
          n.outlineColor = (src as any).outlineColor;
        if ((src as any).color !== undefined) n.color = (src as any).color;
      }
      onChange({ ...doc, nodes: newNodes });
    },
    [doc, onChange],
  );

  return (
    <LegacySlideCanvas
      imageUrl={imageUrl}
      layout={layout}
      onLayoutChange={handleLayoutChange}
    />
  );
}
