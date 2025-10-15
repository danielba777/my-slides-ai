"use client";

import LegacySlideCanvas from "@/canvas/legacy/SlideCanvasLegacy";
import type { CanvasDoc, CanvasTextNode } from "@/canvas/types";
import type { SlideTextElement } from "@/lib/types";
import { useCallback, useMemo } from "react";

type ExtendedCanvasTextNode = CanvasTextNode & {
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  weight?: "regular" | "semibold" | "bold" | "normal";
  color?: string;
  italic?: boolean;
  outlineEnabled?: boolean;
  outlineWidth?: number;
  outlineColor?: string;
  content?: string;
  zIndex?: number;
  width?: number;
  height?: number;
  scale?: number;
  nx?: number;
  ny?: number;
  nmaxWidth?: number;
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
    const img = doc.nodes.find(
      (n): n is Extract<CanvasDoc["nodes"][number], { type: "image" }> =>
        n.type === "image",
    );
    return img?.url ?? "";
  }, [doc]);

  const layout = useMemo<SlideTextElement[]>(() => {
    const texts = doc.nodes.filter(
      (n): n is ExtendedCanvasTextNode => n.type === "text",
    );
    return texts.map((t, i) => {
      // accept both legacy "text" and newer "content" fields for text nodes
      const rawContent: string = t.content ?? t.text ?? "";
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
        id: t.id,
        content: rawContent,
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
        const node = newNodes[i];
        if (!node || node.type !== "text") continue;
        const src = next[ti++];
        if (!src) break;

        const pxX = Math.round((src.x ?? 0.5) * W);
        const pxY = Math.round((src.y ?? 0.5) * H);

        const target = node as ExtendedCanvasTextNode;
        target.x = pxX;
        target.y = pxY;
        target.nx = pxToNormX(pxX);
        target.ny = pxToNormY(pxY);
        target.rotation = src.rotation ?? 0;
        target.scale = src.scale ?? 1;
        target.fontSize = Math.round(BASE_FONT_PX * (src.scale ?? 1));
        target.width = src.maxWidth ?? target.width ?? 400;
        target.height = (src as any).maxHeight ?? target.height;
        target.lineHeight = src.lineHeight ?? 1.12;
        target.letterSpacing = src.letterSpacing ?? 0;
        target.zIndex = src.zIndex ?? target.zIndex ?? i;
        target.align = src.align ?? "left";
        target.weight =
          src.weight === "bold"
            ? "bold"
            : src.weight === "semibold"
              ? "semibold"
              : "regular";
        // write both fields for compatibility across canvas implementations
        target.content = src.content ?? target.content ?? "";
        target.text = src.content ?? target.text ?? "";

        // Extras
        if ((src as any).italic !== undefined)
          target.italic = (src as any).italic;
        if ((src as any).outlineEnabled !== undefined)
          target.outlineEnabled = (src as any).outlineEnabled;
        if ((src as any).outlineWidth !== undefined)
          target.outlineWidth = (src as any).outlineWidth;
        if ((src as any).outlineColor !== undefined)
          target.outlineColor = (src as any).outlineColor;
        if ((src as any).color !== undefined)
          target.color = (src as any).color;
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
