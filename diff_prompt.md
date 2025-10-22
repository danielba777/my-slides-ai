Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

src/canvas/legacy/SlideCanvasLegacy.tsx.

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@
const W = 1080;
const H = 1920;
const PADDING = 8;
const BASE_FONT_PX = 72;
+// Zusätzlicher Puffer für Descender (z. B. g, y, p, q, j), damit beim Export nichts abgeschnitten wird
+const DESCENT_PAD = Math.ceil(BASE_FONT_PX \* 0.25); // ~25 % der Basis-Fonthöhe

// Export aspect ratio for responsive containers
export const ASPECT_RATIO = 9 / 16;

/\*_ Build outer-only text outline via multiple text-shadows (no inner stroke) _/
function buildOuterTextShadow(px: number, color: string): string {
@@
const boxLeft = -layer.width / 2;
const boxTop = -layerHeight / 2;

-      ctx.beginPath();
-      ctx.rect(boxLeft, boxTop, layer.width, layerHeight);
-      ctx.clip();

*      // WICHTIG: Clip um Descender-Puffer erweitern, damit die letzte Zeile unten nicht beschnitten wird
*      const effectiveLayerHeight = layerHeight + DESCENT_PAD;
*      ctx.beginPath();
*      ctx.rect(boxLeft, boxTop, layer.width, effectiveLayerHeight);
*      ctx.clip();
  @@
  const drawOuterStrokeLine = (raw: string, yPos: number) => {
  if (!(outlineEnabled && outlineWidth > 0)) return;
  // Offscreen in Größe der Textbox (inkl. Padding-Content-Bereich)
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.ceil(layer.width));

-        off.height = Math.max(1, Math.ceil(layerHeight));

*        // Auch Offscreen-Canvas nach unten erweitern, damit Stroke/Shadow der Descender Platz hat
*        off.height = Math.max(1, Math.ceil(layerHeight + DESCENT_PAD));
         const ox = off.getContext("2d")!;
         ox.font = ctx.font;
         ox.textBaseline = "alphabetic";
         (ox as any).fontKerning = "normal";

\*\*\* End Patch
