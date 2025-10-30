Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@

- const handleConfirm = (imageUrl: string) => {

* const handleConfirm = async (imageUrl: string) => {
  const updated = slides.slice();
  if (!updated[index]) return;

  // ➕ Persönliches Bild als Overlay-Node (unter dem Text, über dem BG)
  const slide = updated[index]!;
  const canvas = ensureCanvas(slide.canvas as CanvasDoc | undefined);

  // Entferne evtl. vorhandenes persönliches Bild (1 pro Slide)
  const nodesWithoutOld = canvas.nodes.filter(
  (n: any) => !(n?.type === "image" && n?.id === "user-overlay-image"),
  );

- // Vollflächig initialisieren (Cover/Contain handled der Legacy-Canvas bereits visuell)
- const personalNode = {
-      id: "user-overlay-image",
-      type: "image" as const,
-      x: 0,
-      y: 0,
-      width: canvas.width,
-      height: canvas.height,
-      url: imageUrl,
- };

* // Bild NATÜRLICH und ZENTRIERT platzieren (kein Zuschneiden, kein Cover)
* // -> auf natürliche Größe, falls größer als Canvas: proportional auf Canvas einpassen (contain)
* let natW = canvas.width;
* let natH = canvas.height;
* try {
*      const img = await loadImageDecoded(imageUrl);
*      natW = img.naturalWidth || natW;
*      natH = img.naturalHeight || natH;
* } catch {
*      // Fallback: halbe Canvasgröße
*      natW = Math.round(canvas.width * 0.5);
*      natH = Math.round(canvas.height * 0.5);
* }
* const scale = Math.min(1, canvas.width / natW, canvas.height / natH);
* const finalW = Math.round(natW \* scale);
* const finalH = Math.round(natH \* scale);
* const centeredX = Math.round((canvas.width - finalW) / 2);
* const centeredY = Math.round((canvas.height - finalH) / 2);
*
* const personalNode = {
*      id: "user-overlay-image",
*      type: "image" as const,
*      x: centeredX,
*      y: centeredY,
*      width: finalW,
*      height: finalH,
*      url: imageUrl,
* };
       const nextCanvas: CanvasDoc = {
         ...canvas,
         nodes: [...nodesWithoutOld, personalNode],
         // direkt vorselektieren, damit Drag/Zoom sofort funktioniert
         selection: ["user-overlay-image"],
       };

       updated[index] = { ...slide, canvas: nextCanvas };
       setSlides(updated);
       setOpen(false);
  };
  \*\*\* End Patch
