Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

Diff #1 – Autosave-Spam abstellen (keine POST-Flut während Generierung)

File: src/hooks/presentation/useSlideChangeWatcher.ts

codebase

\*\*\* a/src/hooks/presentation/useSlideChangeWatcher.ts
--- b/src/hooks/presentation/useSlideChangeWatcher.ts
@@
// Watch for changes to the slides array and trigger save
useEffect(() => {

- // Only save if we have slides and we're not generating
- if (slides.length > 0) {

* // Nur speichern, wenn NICHT generiert wird – verhindert POST-Spam & UI-Flackern
* if (slides.length > 0 && !isGeneratingPresentation) {
  save();
  }

- }, [slides, save, isGeneratingPresentation]);

* }, [slides, save, isGeneratingPresentation]);

Wirkung: Während isGeneratingPresentation=true wird nicht gespeichert → die vielen POST /dashboard/slideshows/... hören auf.

Diff #2 – Textpositionen behalten & BG-Image ohne Node-Reset setzen

File: src/hooks/presentation/useSlideOperations.ts
(enthält bereits applyBackgroundImageToCanvas und buildCanvasDocFromSlide)

codebase

\*\*\* a/src/hooks/presentation/useSlideOperations.ts
--- b/src/hooks/presentation/useSlideOperations.ts
@@
export function buildCanvasDocFromSlide(
slide: PlateSlide,
): { canvas: CanvasDoc; position?: { x: number; y: number } } {

- const segments = collectTextSegments(slide.content);
- const width = slide.canvas?.width ?? CANVAS_WIDTH;
- const height = slide.canvas?.height ?? CANVAS_HEIGHT;
- const base: CanvasDoc = {
- version: slide.canvas?.version ?? 1,
- width,
- height,
- bg: slide.bgColor ?? slide.canvas?.bg ?? DEFAULT_CANVAS.bg,
- nodes: [],
- selection: [],
- previewDataUrl: slide.canvas?.previewDataUrl,
- };

* const segments = collectTextSegments(slide.content);
* const width = slide.canvas?.width ?? CANVAS_WIDTH;
* const height = slide.canvas?.height ?? CANVAS_HEIGHT;
* const base: CanvasDoc = {
* version: slide.canvas?.version ?? 1,
* width,
* height,
* bg: slide.bgColor ?? slide.canvas?.bg ?? DEFAULT_CANVAS.bg,
* nodes: [],
* selection: [],
* previewDataUrl: slide.canvas?.previewDataUrl,
* };

- let textPosition: { x: number; y: number } | undefined;

* // 🔒 WICHTIG: Wenn bereits ein Canvas mit Nodes existiert, NIEMALS neu aufbauen.
* // Das verhindert, dass Text/Elemente beim Rendern "zurückspringen".
* if (Array.isArray(slide.canvas?.nodes) && slide.canvas!.nodes.length > 0) {
* const withBg = applyBackgroundImageToCanvas(slide.canvas, slide.rootImage?.url);
* return { canvas: withBg, position: slide.position };
* }
*
* let textPosition: { x: number; y: number } | undefined;
  @@

- if (segments.length > 0) {

* if (segments.length > 0) {
  const content = segments.join("\n\n");
  @@

- let x = slide.position?.x ?? /_ ... _/

* let x = slide.position?.x ?? /_ ... _/
  // (Rest unverändert)
  }

- // (Rest: Nodes aus content erzeugen, etc.)
- // Füge am Ende ggf. das Root-Image als BG hinzu
- const finalDoc = applyBackgroundImageToCanvas(base, slide.rootImage?.url);
- return { canvas: finalDoc, position: textPosition };

* // (Rest: Nodes aus content erzeugen, etc.)
* // Füge am Ende das Root-Image als BG hinzu (ohne Text zu überschreiben)
* const finalDoc = applyBackgroundImageToCanvas(base, slide.rootImage?.url);
* return { canvas: finalDoc, position: textPosition };

Wirkung:

Wenn ein Slide bereits ein canvas.nodes hat, wird es eins-zu-eins weiterverwendet (inkl. Textpositionen).

Das Hintergrundbild wird idempotent als unterster Node gesetzt (ohne andere Nodes zu löschen). → Kein Zurückspringen, kein Flackern, kein Greenscreen-Zwischenzustand. (Die Funktion selbst ist schon korrekt implementiert in dieser Datei.)

codebase

Diff #3 – Beim Anzeigen sofort vollständige Slides (BG + Text) rendern

File: src/components/presentation/presentation-page/PresentationSlidesView.tsx

codebase

\*\*\* a/src/components/presentation/presentation-page/PresentationSlidesView.tsx
--- b/src/components/presentation/presentation-page/PresentationSlidesView.tsx
@@
-import { DEFAULT_CANVAS, type CanvasDoc } from "@/canvas/types";
+import { DEFAULT_CANVAS, type CanvasDoc } from "@/canvas/types";
+import { applyBackgroundImageToCanvas } from "@/hooks/presentation/useSlideOperations";
@@

- const safeCanvas: CanvasDoc =

* const safeCanvas: CanvasDoc =
  (slide.canvas as CanvasDoc | undefined) ?? {
  version: DEFAULT_CANVAS.version,
  width: DEFAULT_CANVAS.width,
  height: DEFAULT_CANVAS.height,
  bg: DEFAULT_CANVAS.bg,
  nodes: [],
  selection: [],
  };

- const imgUrl = slide.rootImage?.url as string | undefined;
- const imageReady = useImageReady(imgUrl);

* const imgUrl = slide.rootImage?.url as string | undefined;
* // BG-Image direkt in den Canvas-Daten verankern, ohne Text zu verlieren
* const docWithBg = applyBackgroundImageToCanvas(safeCanvas, imgUrl);
* const imageReady = useImageReady(imgUrl);
  @@

-            {imageReady ? (
-              <SlideCanvas
-                slide={{ ...slide, canvas: safeCanvas }}
-                slideIndex={index}
-                disableDrag={isPresenting}
-              />
-            ) : (
-              <div className="h-[700px] w-[420px] rounded-lg bg-muted" />
-            )}

*            {imageReady ? (
*              <SlideCanvas
*                slide={{ ...slide, canvas: docWithBg }}
*                slideIndex={index}
*                disableDrag={isPresenting}
*              />
*            ) : (
*              // Stabiles Placeholder, aber KEIN Entfernen/Neu-Erzeugen der Nodes
*              <SlideCanvas
*                slide={{ ...slide, canvas: docWithBg }}
*                slideIndex={index}
*                disableDrag
*              />
*            )}

Wirkung:

Wir rendern sofort den Canvas inkl. Text und bereits gesetztem BG-Image.

Während das Bild noch dekodiert (useImageReady), bleibt das Canvas bestehen (kein Unmount/Remount), also keine Layout-Resets.

Sobald das Bild bereit ist, ist es schon als Node vorhanden → kein Schwarz/Greenscreen-Flackern.

Was das insgesamt fix’t

Flackern weg: BG-Image wird idempotent als Node gehalten; wir unmounten die Canvas-Instanz nicht mehr während des Decodes.

Text springt nicht zurück: buildCanvasDocFromSlide respektiert vorhandene canvas.nodes; es werden keine Text-Nodes mehr neu erstellt, wenn schon vorhanden.

POST-Spam weg: Autosave läuft nicht während der Generierung.
