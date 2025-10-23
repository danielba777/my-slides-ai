Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

\*\*\* a/src/components/presentation/canvas/SlideCanvasBase.tsx
--- b/src/components/presentation/canvas/SlideCanvasBase.tsx
@@
"use client";

import type { CanvasDoc, CanvasTextNode } from "@/canvas/types";
import { usePresentationState } from "@/states/presentation-state";
import {
type PlateNode,
type PlateSlide,
} from "@/components/presentation/utils/parser";
import { Button } from "@/components/ui/button";
import { withDefaults, addText } from "@/canvas/commands";
-import { useCallback, useEffect, useMemo, useRef, useState } from "react";
+import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Rect, Stage, Text, Image as KonvaImage } from "react-konva";

interface SlideCanvasProps {
slide: PlateSlide;
slideIndex: number;
width?: number;
height?: number;
disableDrag?: boolean;
showExportButton?: boolean;
}

@@
return [image];
}

export default function SlideCanvasBase({
slide,
slideIndex,
width = 420,
height = 700,
disableDrag = false,
showExportButton = true,
}: SlideCanvasProps) {
@@
const stageRef = useRef<any>(null);
const [image] = useCanvasImage(slide.rootImage?.url ?? "");

- const textRef = useRef<any>(null);

  // Globaler Listener für den "Text +" Button in der Plate FixedToolbar
  useEffect(() => {
  const handler = () => {
  const { slides, setSlides } = usePresentationState.getState();
  @@
  }, [canvasDoc]);

  const stageDimensions = useMemo(
  () => ({
  width: canvasDoc?.width ?? width,
  height: canvasDoc?.height ?? height,
  }),
  [canvasDoc?.height, canvasDoc?.width, height, width],
  );
  @@
  const textContent = useMemo(() => {
  if (activeTextNode?.text) {
  return activeTextNode.text;
  }
  return extractPlainText(slide.content ?? []);
  }, [activeTextNode?.text, slide.content]);

- // ========= Text-Background (BLOCK) – State & Events =========
- type TextBgMode = "block" | "blob";
- const [textBgEnabled, setTextBgEnabled] = useState(false);
- const [textBgMode, setTextBgMode] = useState<TextBgMode>("block"); // nur Block wird gezeichnet
- const [textBgPadding, setTextBgPadding] = useState(12);
- const [textBgRadius, setTextBgRadius] = useState(12);
- const [textBgOpacity, setTextBgOpacity] = useState(0.55);
- const [textBgColorHex, setTextBgColorHex] = useState("#000000");
-
- // Utility: HEX → rgba()
- function hexToRgba(hex: string, alpha = 1) {
- const a = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
- let h = String(hex || "").trim().replace(/^#/, "");
- if (h.length === 3) h = h.split("").map((c) => c + c).join("");
- const int = parseInt(h || "000000", 16);
- const r = (int >> 16) & 255;
- const g = (int >> 8) & 255;
- const b = int & 255;
- return `rgba(${r}, ${g}, ${b}, ${a})`;
- }
- const textBgFill = useMemo(
- () => hexToRgba(textBgColorHex, textBgOpacity),
- [textBgColorHex, textBgOpacity]
- );
-
- // Konfig von der Toolbar übernehmen
- useEffect(() => {
- const onToggle = (e: Event) => {
-      const detail = (e as CustomEvent).detail as { enabled?: boolean; mode?: TextBgMode };
-      if (typeof detail?.enabled === "boolean") setTextBgEnabled(detail.enabled);
-      if (detail?.mode) setTextBgMode(detail.mode);
- };
- const onConfig = (e: Event) => {
-      const d = (e as CustomEvent).detail as {
-        padding?: number;
-        radius?: number;
-        opacity?: number;
-        color?: string;
-      };
-      if (typeof d?.padding === "number") setTextBgPadding(Math.max(0, d.padding));
-      if (typeof d?.radius === "number") setTextBgRadius(Math.max(0, d.radius));
-      if (typeof d?.opacity === "number")
-        setTextBgOpacity(Math.max(0, Math.min(1, d.opacity)));
-      if (typeof d?.color === "string") setTextBgColorHex(d.color);
- };
- window.addEventListener("canvas:text-bg", onToggle as EventListener);
- window.addEventListener("canvas:text-bg:config", onConfig as EventListener);
- return () => {
-      window.removeEventListener("canvas:text-bg", onToggle as EventListener);
-      window.removeEventListener("canvas:text-bg:config", onConfig as EventListener);
- };
- }, []);
-
- // Sicherheit: falls Node bereits eine BG-Farbe hat, initial aktivieren
- useEffect(() => {
- if (activeTextNode?.textBg && !textBgEnabled) setTextBgEnabled(true);
- }, [activeTextNode?.textBg, textBgEnabled]);
-
- // Text-Messung (Höhe) für Block-BG
- const [textBBox, setTextBBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
- useEffect(() => {
- // nach Render kurz warten, dann ClientRect lesen
- const id = requestAnimationFrame(() => {
-      const t = textRef.current;
-      if (!t) return;
-      try {
-        const rect = t.getClientRect({ skipTransform: false });
-        if (rect && Number.isFinite(rect.width) && Number.isFinite(rect.height)) {
-          setTextBBox({ w: rect.width, h: rect.height });
-        }
-      } catch {}
- });
- return () => cancelAnimationFrame(id);
- }, [
- textContent,
- activeTextNode?.width,
- activeTextNode?.fontSize,
- activeTextNode?.lineHeight,
- activeTextNode?.letterSpacing,
- textPosition.x,
- textPosition.y,
- ]);
- // während des Draggens live die UI-Position updaten (kontrollierte Komponente)
  const handleDragMove = useCallback((event: any) => {
  isDraggingTextRef.current = true;
  const next = { x: event.target.x(), y: event.target.y() };
  // keine Persistierung hier – nur UI-State
  setTextPosition(next);
  }, []);
  @@
  }, [
  slideWithExtras.position?.x,
  slideWithExtras.position?.y,
  defaultPosition,
  textPosition.x,
  textPosition.y,
  ]);

@@
return (
<>
<Stage
         ref={stageRef}
         width={stageDimensions.width}
         height={stageDimensions.height}
         listening={!disableDrag}
       >
<Layer>
{/_ Background Image (falls vorhanden) _/}
{image ? (
<KonvaImage
               image={image}
               x={0}
               y={0}
               width={stageDimensions.width}
               height={stageDimensions.height}
               listening={false}
             />
) : (
<Rect
x={0}
y={0}
width={stageDimensions.width}
height={stageDimensions.height}
fill={"#000"}
listening={false}
/>
)}

-          {/* Text (ein einzelner aktiver Textknoten) */}

*          {/* BLOCK-HINTERGRUND (nur wenn aktiviert) */}
*          {textBgEnabled && textBgMode === "block" && activeTextNode && (
*            <Rect
*              x={(textPosition.x ?? 0) - textBgPadding}
*              y={(textPosition.y ?? 0) - textBgPadding}
*              width={(activeTextNode.width ?? 400) + textBgPadding * 2}
*              height={Math.max(0, textBBox.h) + textBgPadding * 2}
*              fill={textBgFill}
*              cornerRadius={Math.max(0, textBgRadius)}
*              listening={false}
*            />
*          )}
*
*          {/* Text (ein einzelner aktiver Textknoten) */}
           {activeTextNode && (
             <Text
*              ref={textRef}
                x={textPosition.x ?? 0}
                y={textPosition.y ?? 0}
                draggable={!disableDrag}
                text={textContent}
                // Typografie aus Node (sinnvolle Defaults)
                fontFamily={activeTextNode.fontFamily ?? "Inter, system-ui, sans-serif"}
                fontSize={activeTextNode.fontSize ?? 64}
                align={activeTextNode.align ?? "center"}
                width={activeTextNode.width ?? Math.round(stageDimensions.width * 0.7)}
                lineHeight={activeTextNode.lineHeight ?? 1.12}
                letterSpacing={activeTextNode.letterSpacing ?? 0}
                fill={activeTextNode.fill ?? "#ffffff"}
                shadowEnabled={false}
                onDragMove={handleDragMove}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                listening={!disableDrag}
              />
            )}
          </Layer>
        </Stage>

        {showExportButton ? (
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                try {
                  const uri = stageRef.current?.toDataURL({ pixelRatio: 2 });
                  if (!uri) return;
                  const a = document.createElement("a");
                  a.href = uri;
                  a.download = "slide.png";
                  a.click();
                } catch {}
              }}
            >
              Export PNG
            </Button>
          </div>
        ) : null}
      </>

  );
  }
