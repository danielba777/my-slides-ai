Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Add File: src/lib/canvasImageCors.ts
+// Erzeugt eine CORS-sichere blob:-URL für ein externes Bild,
+// damit die Canvas beim Export nicht "tainted" wird.
+// Minimal-invasiv, ohne Backend-/Header-Anpassungen.
+const urlCache = new Map<string, string>();

- +export async function getCorsSafeImageUrl(src: string): Promise<string> {
- if (!src) return src;
- // Bereits sicher oder lokal
- if (src.startsWith("blob:") || src.startsWith("data:")) return src;
- // Cache-Hit
- if (urlCache.has(src)) return urlCache.get(src)!;
-
- const res = await fetch(src, { mode: "cors", credentials: "omit" });
- if (!res.ok) {
- // Fallback: Original-URL (Export könnte scheitern, aber wir brechen nicht UI)
- return src;
- }
- const blob = await res.blob();
- const safe = URL.createObjectURL(blob);
- urlCache.set(src, safe);
- return safe;
  +}
- +export function revokeCorsSafeImageUrl(safeUrl: string) {
- try {
- if (safeUrl?.startsWith("blob:")) URL.revokeObjectURL(safeUrl);
- } catch {}
  +}
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/components/presentation/presentation-page/PresentationSlidesView.tsx
  @@
  -import React, { memo, useEffect, useRef } from "react";
  +import React, { memo, useEffect, useRef, useState } from "react";
  @@
  import type { SlideCanvasAdapterHandle } from "@/canvas/SlideCanvasAdapter";
  import StickyDownloadActions from "./StickyDownloadActions";
  +import { getCorsSafeImageUrl, revokeCorsSafeImageUrl } from "@/lib/canvasImageCors";

@@
const SlideFrame = memo(function SlideFrame({ slide, index, isPresenting, slidesCount }: {
slide: any; index: number; isPresenting: boolean; slidesCount: number;
}) {
@@

- const docWithBg = applyBackgroundImageToCanvas(safeCanvas, imgUrl);
- const imageReady = useImageReady(imgUrl);

* // Bild-URL CORS-sicher machen, damit Canvas-Export nicht "tainted" ist
* const [safeImgUrl, setSafeImgUrl] = useState<string>(imgUrl);
* useEffect(() => {
* let active = true;
* let previousBlobUrl: string | null = null;
* (async () => {
*      const safeUrl = await getCorsSafeImageUrl(imgUrl);
*      if (!active) return;
*      // Wenn wir eine neue blob:-URL erzeugen, alte aufräumen
*      if (previousBlobUrl && previousBlobUrl !== safeUrl) {
*        revokeCorsSafeImageUrl(previousBlobUrl);
*      }
*      setSafeImgUrl(safeUrl);
*      // Merken, um beim nächsten Durchlauf zu revoken
*      if (safeUrl.startsWith("blob:")) previousBlobUrl = safeUrl;
* })();
* return () => {
*      active = false;
*      if (previousBlobUrl) revokeCorsSafeImageUrl(previousBlobUrl);
* };
* }, [imgUrl]);
*
* const docWithBg = applyBackgroundImageToCanvas(safeCanvas, safeImgUrl);
* const imageReady = useImageReady(safeImgUrl);
  const canvasRef = useRef<SlideCanvasAdapterHandle | null>(null);
  // Registriere pro Slide einen Exporter in einer globalen Map, damit der Header
  // zentral in der aktuellen Reihenfolge exportieren kann.
  \*\*\* End Patch
