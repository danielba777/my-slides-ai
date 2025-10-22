Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@
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

- /\*_ === Unified Line-Blob Background (zusammenhängende Form, aber pro Zeile gemessene Breite) === _/
- bgUnifiedEnabled?: boolean; // Hintergrund an/aus
- bgUnifiedColor?: string; // HEX, z. B. #FFFFFF
- bgUnifiedOpacity?: number; // 0..1
- bgUnifiedRadius?: number; // px, Rundung der Linien-Enden
- bgUnifiedPadX?: number; // inneres Horizontal-Padding um jede Zeile
- bgUnifiedPadY?: number; // inneres Vertikal-Padding um jede Zeile
- bgUnifiedJoin?: number; // vertikale Überlappung zwischen Zeilen-Kapseln (px), lässt sie zu EINER Form verschmelzen
  };
  @@
  const PADDING = 8;
  const BASE_FONT_PX = 72;
  +// Gegen abgeschnittene Unterlängen (g,y,p,q,j)
  +const DESCENT_PAD = Math.ceil(BASE_FONT_PX \* 0.25);

// Export aspect ratio for responsive containers
export const ASPECT_RATIO = 9 / 16;

/\*_ Build outer-only text outline via multiple text-shadows (no inner stroke) _/
function buildOuterTextShadow(px: number, color: string): string {
const r = Math.max(0, Math.round(px));
return [
@@
);

-
- /\*_ Farb-Utils _/
- function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
- const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex?.trim?.() ?? "");
- if (!m) return null;
- return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
- }
- function withOpacity(hex: string, a = 1): string {
- const rgb = hexToRgb(hex) ?? { r: 255, g: 255, b: 255 };
- const alpha = Math.max(0, Math.min(1, Number.isFinite(a) ? a : 1));
- return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
- }
  @@
  const setTextColor = (color: string) => {
  applyToActive((l) => ({ ...l, color }));
  };
  const setOutlineColor = (color: string) => {
  applyToActive((l) => ({ ...l, outlineEnabled: true, outlineColor: color }));
  };
-
- // === Unified Line-Blob Background Controls ===
- const toggleUnifiedBg = () => {
- applyToActive((l) => ({ ...l, bgUnifiedEnabled: !(l as any).bgUnifiedEnabled }));
- };
- const setUnifiedBgColor = (color: string) => {
- applyToActive((l) => ({ ...l, bgUnifiedColor: color }));
- };
- const setUnifiedBgOpacity = (v: number) => {
- const n = Math.max(0, Math.min(1, v));
- applyToActive((l) => ({ ...l, bgUnifiedOpacity: n }));
- };
- const setUnifiedBgRadius = (px: number) => {
- const n = Math.max(0, Math.min(64, Math.round(px)));
- applyToActive((l) => ({ ...l, bgUnifiedRadius: n }));
- };
- const setUnifiedBgPadX = (px: number) => {
- const n = Math.max(0, Math.min(200, Math.round(px)));
- applyToActive((l) => ({ ...l, bgUnifiedPadX: n }));
- };
- const setUnifiedBgPadY = (px: number) => {
- const n = Math.max(0, Math.min(200, Math.round(px)));
- applyToActive((l) => ({ ...l, bgUnifiedPadY: n }));
- };
- const setUnifiedBgJoin = (px: number) => {
- const n = Math.max(0, Math.min(100, Math.round(px)));
- applyToActive((l) => ({ ...l, bgUnifiedJoin: n }));
- };
  @@

* // Text (skip fully off-canvas)

- // Text (skip fully off-canvas)
  const sorted = [.textLayers].sort((a, b) => a.zIndex - b.zIndex);
  for (const layer of sorted) {
  if (!layer.content) continue;

         const lines = computeWrappedLinesWithDOM(layer as any);

  @@
  const startYTop = boxTop + PADDING + lineHeightPx;
  let y = startYTop;

-      // === Unified Line-Blob Hintergrund (Preview & Export identisch) ===
-      const drawUnifiedLineBlob = () => {
-        if (!(layer as any).bgUnifiedEnabled) return;
-        const color = (layer as any).bgUnifiedColor ?? "#ffffff";
-        const opacity = (layer as any).bgUnifiedOpacity ?? 0.84;
-        const radius = Math.max(0, (layer as any).bgUnifiedRadius ?? 14);
-        const padX = Math.max(0, (layer as any).bgUnifiedPadX ?? 12);
-        const padY = Math.max(0, (layer as any).bgUnifiedPadY ?? 8);
-        const join = Math.max(0, (layer as any).bgUnifiedJoin ?? Math.min(6, Math.round(radius * 0.5)));
-
-        const textW = Math.max(0, layer.width - 2 * PADDING);
-        // pro Zeile Breite messen (inkl. letterSpacing)
-        const measureLine = (raw: string) => {
-          if (layer.letterSpacing === 0) return ctx.measureText(raw).width;
-          let w = 0;
-          for (const ch of raw) w += ctx.measureText(ch).width + layer.letterSpacing;
-          return Math.max(0, w - (raw.length > 0 ? layer.letterSpacing : 0));
-        };
-
-        // Hintergrundpfade Zeile für Zeile als abgerundete Kapseln,
-        // vertikal leicht überlappend (join), sodass alles EIN Blob wirkt.
-        ctx.save();
-        ctx.fillStyle = withOpacity(color, opacity);
-
-        let yCursor = startYTop;
-        for (let i = 0; i < lines.length; i++) {
-          const raw = lines[i]!;
-          const lineW = measureLine(raw);
-          const pillW = Math.ceil(lineW + padX * 2);
-          const pillH = Math.ceil(lineHeightPx + padY * 2 + DESCENT_PAD * 0.4);
-
-          // Start-X je nach Ausrichtung
-          let startX = baseLeft + PADDING;
-          if (layer.align === "center") startX = baseLeft + PADDING + (textW - pillW) / 2;
-          else if (layer.align === "right") startX = baseLeft + PADDING + (textW - pillW);
-
-          // Vertikal: vorherige Kapsel leicht überlappen
-          const yTop = i === 0 ? yCursor - lineHeightPx - padY : yCursor - lineHeightPx - padY - Math.min(join, Math.floor(radius));
-
-          // Abgerundetes Rechteck zeichnen (Round-Rect Path)
-          const rx = Math.min(radius, pillH / 2);
-          const x0 = startX;
-          const y0 = yTop;
-          const x1 = startX + pillW;
-          const y1 = yTop + pillH;
-          ctx.beginPath();
-          ctx.moveTo(x0 + rx, y0);
-          ctx.lineTo(x1 - rx, y0);
-          ctx.quadraticCurveTo(x1, y0, x1, y0 + rx);
-          ctx.lineTo(x1, y1 - rx);
-          ctx.quadraticCurveTo(x1, y1, x1 - rx, y1);
-          ctx.lineTo(x0 + rx, y1);
-          ctx.quadraticCurveTo(x0, y1, x0, y1 - rx);
-          ctx.lineTo(x0, y0 + rx);
-          ctx.quadraticCurveTo(x0, y0, x0 + rx, y0);
-          ctx.closePath();
-          ctx.fill();
-
-          yCursor += lineHeightPx; // zur nächsten Textzeile
-        }
-        ctx.restore();
-      };
-
-      // Zuerst den einheitlichen Hintergrund zeichnen
-      drawUnifiedLineBlob();
-        const outlineEnabled = (layer as any).outlineEnabled;
         const outlineWidth = (layer as any).outlineWidth ?? 6;
         const outlineColor = (layer as any).outlineColor ?? "#000";
  @@
  // 2) Innenanteil subtrahieren
  ox.globalCompositeOperation = "destination-out";
  \*\*\* End Patch
