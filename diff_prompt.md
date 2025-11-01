Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src\canvas\legacy\SlideCanvasLegacy.tsx
@@

-      const clipRect = {

*      const clipRect = {
         x: boxLeft,

-
-        y: boxTop,
-
-        width: layer.width,
-
-        height: layerHeight + DESCENT_PAD,

*        y: boxTop,
*        width: layer.width,
*        // exakt wie Preview: keine zusätzliche Descender-Reserve
*        height: layerHeight,
         };
  @@

-      exportCtx.font = `${italic ? "italic " : ""}${weight} ${BASE_FONT_PX}px ${layer.fontFamily}`;

*      exportCtx.font = `${italic ? "italic " : ""}${weight} ${BASE_FONT_PX}px ${layer.fontFamily}`;
       (exportCtx as any).fontKerning = "normal";
       exportCtx.fillStyle = layer.color;

-      exportCtx.textBaseline = "alphabetic";

*      // identisch zum Preview ausrichten
*      exportCtx.textBaseline = TEXT_BASELINE as CanvasTextBaseline;

-      const lineHeightPx = BASE_FONT_PX * layer.lineHeight;
-      const sampleMetrics = exportCtx.measureText("Mg");
-      const ascentEstimate =
-        sampleMetrics.actualBoundingBoxAscent ?? BASE_FONT_PX * 0.72;
-      const descentEstimate =
-        sampleMetrics.actualBoundingBoxDescent ?? BASE_FONT_PX * 0.28;
-      const lineGap = Math.max(
-        0,
-        lineHeightPx - (ascentEstimate + descentEstimate),
-      );
-      const startYTop = boxTop + PADDING + ascentEstimate + lineGap / 2;
-      let y = startYTop;

*      // benutze exakt die DOM-berechnete Line-Höhe (wie im Preview gemessen)
*      const lineMeasure = measureWrappedText({
*        text: String(layer.content ?? ""),
*        fontFamily: layer.fontFamily ?? "Inter",
*        fontWeight: weight,
*        fontStyle: italic ? "italic" : "normal",
*        fontSizePx: BASE_FONT_PX,
*        lineHeightPx: BASE_FONT_PX * (layer.lineHeight ?? 1.12),
*        maxWidthPx: Math.max(8, layer.width),
*        letterSpacingPx: layer.letterSpacing ?? 0,
*        whiteSpaceMode: "pre-wrap",
*        wordBreakMode: "normal",
*        paddingPx: PADDING,
*      });
*      const lineHeightPx = lineMeasure.lineHeight;
*      // Baseline "middle": erste Zeile genau mittig in ihrer Box starten
*      let y = boxTop + PADDING + lineHeightPx / 2;
  @@

-      const drawOuterStrokeLine = (raw: string, yPos: number) => {

*      const drawOuterStrokeLine = (raw: string, yPos: number) => {
           if (!(outlineEnabled && outlineWidth > 0)) return;
  @@

-        const ox = off.getContext("2d")!
-
-        ox.font = exportCtx.font;
-        ox.textBaseline = "alphabetic";

*        const ox = off.getContext("2d")!
*        ox.font = exportCtx.font;
*        // identisches Baseline-Verhalten wie Hauptkontext
*        ox.textBaseline = TEXT_BASELINE as CanvasTextBaseline;
  \*\*\* End Patch
  Zusätzlich (falls du es wirklich „bit-genau“ willst) kannst du die letzte unnötige Rundung entfernen, die gelegentlich +1 px erzeugt. Das ist genau der doppelte Ceil, den ich vorhin erklärt habe (nur Export betroffen):
  codebase

diff
Code kopieren
\*\*\* Update File: src\canvas\legacy\SlideCanvasLegacy.tsx
@@

-      const layerHeight =

*      const layerHeight =
         layer.height && layer.height > 0
           ? layer.height
           : Math.max(
               1,

-              Math.ceil(
-                computeAutoHeightForLayer(
-                  { ...layer, italic: (layer as any).italic },
-                  lines,
-                ),
-              ),

*              // computeAutoHeight(...) liefert bereits gerundete Höhe aus der DOM-Messung
*              computeAutoHeightForLayer(
*                { ...layer, italic: (layer as any).italic },
*                lines,
*              ),
             );
