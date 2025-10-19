Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

1. Auto-Höhe robust & konsistent: Wrapper neu implementieren

Ersetzt computeAutoHeightForLayer(...) so, dass es immer measureWrappedText nutzt und text sicher zu "" coerct.

Keine sonstigen Änderungen.

**_ Begin Patch
_** Update File: apps/dashboard/src/app/(components)/SlideCanvas.tsx
@@
-/\*_ Höhe automatisch bestimmen (lokal) – nutzt ausschließlich die Utility _/
-function computeAutoHeightForLayer(

- layerBase: TextLayer & { italic?: boolean },
- \_lines?: string[],
  -) {
- const weight =
- layerBase.weight === "bold"
-      ? 700
-      : layerBase.weight === "semibold"
-        ? 600
-        : 400;
- const scaledFontPx = BASE_FONT_PX \* (layerBase.scale ?? 1);
- const lineHeightPx = scaledFontPx \* (layerBase.lineHeight ?? 1.12);
- return computeAutoHeightFromUtil({
- text: String(layerBase.content ?? ""),
- fontFamily: layerBase.fontFamily ?? "Inter",
- fontWeight: weight,
- fontStyle: (layerBase as any).italic ? "italic" : "normal",
- fontSizePx: scaledFontPx,
- lineHeightPx,
- maxWidthPx: layerBase.width,
- letterSpacingPx: layerBase.letterSpacing ?? 0,
- whiteSpaceMode: "pre-wrap",
- wordBreakMode: "normal",
- width: layerBase.width,
- paddingPx: PADDING,
- });
  -}
  +/\*_ Höhe automatisch bestimmen (lokal) – direkt über measureWrappedText _/
  +function computeAutoHeightForLayer(

* layerBase: TextLayer & { italic?: boolean },
* \_lines?: string[],
  +) {
* const weight =
* layerBase.weight === "bold"
*      ? 700
*      : layerBase.weight === "semibold"
*        ? 600
*        : 400;
* const scaledFontPx = BASE_FONT_PX \* (layerBase.scale ?? 1);
* const lineHeightPx = scaledFontPx \* (layerBase.lineHeight ?? 1.12);
* const m = measureWrappedText({
* text: String(layerBase.content ?? ""),
* fontFamily: layerBase.fontFamily ?? "Inter",
* fontWeight: weight,
* fontStyle: (layerBase as any).italic ? "italic" : "normal",
* fontSizePx: scaledFontPx,
* lineHeightPx,
* maxWidthPx: Math.max(8, layerBase.width),
* letterSpacingPx: layerBase.letterSpacing ?? 0,
* whiteSpaceMode: "pre-wrap",
* wordBreakMode: "normal",
* paddingPx: PADDING,
* });
* return Math.max(40, Math.ceil(m.totalHeight));
  +}
  \*\*\* End Patch

2. Horizontal-Resize: sofortige Auto-Höhe mit neuem Wrapper

Nutzt den Wrapper aus Patch (1) beim Breiten-Resize.

Damit springt die Box beim Umbruch sofort auf die korrekte Höhe (wie gewünscht) und der Fehler tritt nicht mehr auf.

**_ Begin Patch
_** Update File: apps/dashboard/src/app/(components)/SlideCanvas.tsx
@@
if (mode === "resize-left" || mode === "resize-right") {
// Horizontal resize – Höhe SOFORT neu berechnen (live wrap)
const dx = now.x - start.x;
const delta = mode === "resize-left" ? -dx : dx;
const nextW = Math.max(40, layerStart.width + delta);

-          // Immer Auto-Höhe bei horizontalem Resize → direkte Anpassung bei Zeilenumbruch
-          // WICHTIG: unsere Utility korrekt ansteuern (über den lokalen Wrapper),
-          // und dabei die neue Breite (nextW) verwenden.
-          const computedHeight = Math.ceil(
-            computeAutoHeightForLayer(
-              { ...l, width: nextW, italic: (l as any).italic } as any,
-            ),
-          );

*          // Immer Auto-Höhe bei horizontalem Resize → direkte Anpassung bei Zeilenumbruch
*          const computedHeight = Math.ceil(
*            computeAutoHeightForLayer({
*              ...l,
*              width: nextW,
*              italic: (l as any).italic,
*            } as any),
*          );
             const temp = {
               ...l,
               width: nextW,
               height: Math.max(40, computedHeight),
             } as TextLayer & { autoHeight?: boolean };
             (temp as any).autoHeight = true;
             return temp;
           }
  \*\*\* End Patch
