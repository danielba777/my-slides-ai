"use client";

import LegacySlideCanvas from "@/canvas/legacy/SlideCanvasLegacy";
import type {
  CanvasDoc,
  CanvasImageNode,
  CanvasTextNode,
} from "@/canvas/types";
import type { SlideTextElement } from "@/lib/types";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  TIKTOK_OUTLINE_COLOR,
  TIKTOK_OUTLINE_WIDTH,
} from "./tiktokDefaults";

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
  background?: SlideTextElement["background"];
};

const W = 1080;
const H = 1620; 
const BASE_FONT_PX = 72;

function normToPxX(v: number | undefined) {
  if (v == null) return undefined;
  
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

export type SlideCanvasAdapterHandle = {
  
  exportPNG: () => Promise<Blob>;
  
  focusFirstText: () => void;
  
  clearTextFocus: () => void;
};

type Props = {
  doc: CanvasDoc;
  onChange: (next: CanvasDoc) => void;
  showToolbar?: boolean;
  overlayContent?: React.ReactNode;
  onCloseToolbar?: () => void;
  
  readOnly?: boolean;
};

const SlideCanvasAdapter = forwardRef<SlideCanvasAdapterHandle, Props>(
  (
    { doc, onChange, showToolbar = true, overlayContent, onCloseToolbar, readOnly = false },
    ref,
  ) => {
    
    const legacyRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      exportPNG: async () => {
        if (legacyRef.current?.exportPNG) {
          return legacyRef.current.exportPNG();
        }
        
        return new Blob([], { type: "image/png" });
      },
      focusFirstText: () => {
        if (legacyRef.current?.focusFirstText) {
          legacyRef.current.focusFirstText();
        }
      },
      clearTextFocus: () => {
        if (legacyRef.current?.clearTextFocus) {
          legacyRef.current.clearTextFocus();
        }
      },
    }));
    const imageUrl = useMemo(() => {
      const img = doc.nodes.find(
        (n): n is Extract<CanvasDoc["nodes"][number], { type: "image" }> =>
          n.type === "image" && (n as any).id === "canvas-background-image",
      );
      return img?.url ?? "";
    }, [doc]);

    
    const overlayImages = useMemo<CanvasImageNode[]>(() => {
      return doc.nodes.filter(
        (n): n is CanvasImageNode =>
          n.type === "image" && (n as any).id !== "canvas-background-image",
      );
    }, [doc]);

    const layout = useMemo<SlideTextElement[]>(() => {
      const texts = doc.nodes.filter(
        (n): n is ExtendedCanvasTextNode => n.type === "text",
      );
      return texts.map((t, i) => {
        
        const rawContent: string = t.content ?? t.text ?? "";
        const widthPx = t.width ?? Math.round(W * 0.7);
        const lineCount =
          rawContent.trim().length > 0 ? rawContent.split(/\r?\n/).length : 1;
        const approxHeightPx =
          typeof t.height === "number" && t.height > 0
            ? t.height
            : Math.round(BASE_FONT_PX * (t.lineHeight ?? 1.12) * lineCount);

        const normalizedXPx =
          typeof t.nx === "number"
            ? normToPxX(t.nx)
            : typeof t.x === "number" && t.x >= 0 && t.x <= 1
              ? normToPxX(t.x)
              : undefined;
        const normalizedYPx =
          typeof t.ny === "number"
            ? normToPxY(t.ny)
            : typeof t.y === "number" && t.y >= 0 && t.y <= 1
              ? normToPxY(t.y)
              : undefined;

        
        const xPx =
          normalizedXPx ??
          (typeof t.x === "number" ? t.x + widthPx / 2 : Math.round(W * 0.5));
        const yPx =
          normalizedYPx ??
          (typeof t.y === "number"
            ? t.y + approxHeightPx / 2
            : Math.round(H * 0.5));

        
        const scale =
          typeof t.fontSize === "number" && t.fontSize > 0
            ? t.fontSize / BASE_FONT_PX
            : typeof t.scale === "number" && t.scale > 0
              ? t.scale
              : 1;

        
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
          maxWidth: t.width ?? Math.round(W * 0.7),
          ...(t.height ? { maxHeight: t.height } : {}),
          lineHeight: t.lineHeight ?? 1.12,
          letterSpacing: t.letterSpacing ?? 0,
          zIndex: t.zIndex ?? i,
          align: (t.align as any) ?? "center",
          weight,
          
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
          ...(t.background ? { background: t.background } : {}),
        } as SlideTextElement;
      });
    }, [doc]);

    const handleLayoutChange = useCallback(
      (next: SlideTextElement[]) => {
        
        const newNodes = doc.nodes.map((n) => ({ ...n }));

        
        let ti = 0;
        for (let i = 0; i < newNodes.length; i++) {
          const node = newNodes[i];
          if (!node || node.type !== "text") continue;

          const src = next[ti];
          if (!src) {
            break; 
          }
          ti += 1;

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
          target.width = src.maxWidth ?? target.width ?? Math.round(W * 0.7);
          target.height = (src as any).maxHeight ?? target.height;
          target.lineHeight = src.lineHeight ?? 1.12;
          target.letterSpacing = src.letterSpacing ?? 0;
          target.zIndex = src.zIndex ?? target.zIndex ?? i;
          target.align = src.align ?? "center";
          target.weight =
            src.weight === "bold"
              ? "bold"
              : src.weight === "semibold"
                ? "semibold"
                : "regular";
          
          target.content = src.content ?? target.content ?? "";
          target.text = src.content ?? target.text ?? "";

          
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
          if ((src as any).background !== undefined)
            target.background = (src as any)
              .background as SlideTextElement["background"];
        }

        
        
        const existingTextCount = newNodes.filter(
          (n) => n.type === "text",
        ).length;
        if (next.length > existingTextCount) {
          for (let k = existingTextCount; k < next.length; k++) {
            const src = next[k];
            if (!src) continue;

            const pxX = Math.round((src.x ?? 0.5) * W);
            const pxY = Math.round((src.y ?? 0.5) * H);
            const weight: ExtendedCanvasTextNode["weight"] =
              src.weight === "bold"
                ? "bold"
                : src.weight === "semibold"
                  ? "semibold"
                  : "regular";
            newNodes.push({
              id: src.id ?? `txt-${Date.now()}-${k}`,
              type: "text",
              x: pxX,
              y: pxY,
              nx: pxToNormX(pxX), 
              ny: pxToNormY(pxY), 
              rotation: src.rotation ?? 0,
              width: src.maxWidth ?? Math.round(W * 0.7),
              text: src.content ?? "",
              fontFamily: src.fontFamily ?? "Inter, system-ui, sans-serif",
              fontSize: Math.round(BASE_FONT_PX * (src.scale ?? 1)),
              lineHeight: src.lineHeight ?? 1.12,
              letterSpacing: src.letterSpacing ?? 0,
              align: src.align ?? "center",
              weight,
              color: (src as any).color ?? "#ffffff",
              
              content: src.content ?? "",
              scale: src.scale ?? 1,
              height: (src as any).maxHeight ?? undefined,
              zIndex: src.zIndex ?? newNodes.length,
              italic: (src as any).italic ?? false,
              outlineEnabled: (src as any).outlineEnabled ?? false,
              outlineWidth: (src as any).outlineWidth ?? 6,
              outlineColor: (src as any).outlineColor ?? "#000",
              nmaxWidth: src.maxWidth ?? Math.round(W * 0.7),
              background: (src as any).background ?? undefined,
            } as ExtendedCanvasTextNode);
          }
        }

        
        
        const keepIds = new Set(next.map((t) => t.id));
        for (let i = newNodes.length - 1; i >= 0; i--) {
          const n = newNodes[i] as any;
          if (n?.type === "text" && !keepIds.has(n.id)) {
            newNodes.splice(i, 1);
          }
        }

        onChange({ ...doc, nodes: newNodes });
      },
      [doc, onChange],
    );

    return (
      <LegacySlideCanvas
        ref={legacyRef}
        imageUrl={imageUrl}
        layout={layout}
        overlays={overlayImages}
        showToolbar={showToolbar}
        overlayContent={overlayContent}
        onCloseToolbar={onCloseToolbar}
        readOnly={readOnly}
        onOverlaysChange={(nextOverlays) => {
          const otherNodes = doc.nodes.filter(
            (n) =>
              !(
                n.type === "image" &&
                (n as any).id !== "canvas-background-image"
              ),
          );
          onChange({
            ...doc,
            nodes: [...otherNodes, ...nextOverlays],
          });
        }}
      />
    );
  },
);

SlideCanvasAdapter.displayName = "SlideCanvasAdapter";
export default SlideCanvasAdapter;
