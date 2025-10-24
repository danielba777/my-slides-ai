Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@
-import LegacyEditorToolbar from "@/canvas/LegacyEditorToolbar";
+import LegacyEditorToolbar from "@/canvas/LegacyEditorToolbar";
import type { CanvasImageNode } from "@/canvas/types";
@@
-type Props = {
+type Props = {
imageUrl: string; // "" = schwarz
layout: SlideTextElement[];

- onLayoutChange: (next: SlideTextElement[]) => void;

* onLayoutChange?: (next: SlideTextElement[]) => void;
  /** zusätzliche Overlay-Images (Logo etc.) \*/
  overlays?: CanvasImageNode[];
  /** Callback, wenn Overlays (Position/Größe) geändert wurden \*/
  onOverlaysChange?: (next: CanvasImageNode[]) => void;
  };
  @@
  -const SlideCanvas = forwardRef<SlideCanvasHandle, Props>(function SlideCanvas(

- { imageUrl, layout, onLayoutChange, overlays = [], onOverlaysChange },
  +const SlideCanvas = forwardRef<SlideCanvasHandle, Props>(function SlideCanvas(

* { imageUrl, layout, onLayoutChange, overlays = [], onOverlaysChange },
  ref,
  ) {
  @@
* // Sicherer Wrapper: nur aufrufen, wenn wirklich eine Funktion übergeben wurde
* const onLayout = useCallback((next: SlideTextElement[]) => {
* if (typeof onLayoutChange === "function") {
*      onLayoutChange(next);
* }
* }, [onLayoutChange]);
* \*\*\* End Patch
  🔁 Jetzt müssen noch alle direkten Aufrufe von onLayoutChange(...) in dieser Datei auf onLayout(...) umgestellt werden. (Das sind meist 1–3 Stellen, z. B. in onPointerUp, evtl. in anderen Pointer-Handlern.)

diff
Code kopieren
**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@

- // Beispiel: am Ende eines Pointer-Up Handlers o. ä.
- onLayoutChange(nextLayout);

* // Beispiel: am Ende eines Pointer-Up Handlers o. ä.
* onLayout(nextLayout);
  \*\*\* End Patch
