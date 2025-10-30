Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

\*\*\* a/src/canvas/legacy/SlideCanvasLegacy.tsx
--- b/src/canvas/legacy/SlideCanvasLegacy.tsx
@@
// 1) Background zeichnen (inkl. optionalem Dim)
exportCtx.fillStyle = "#000000";
exportCtx.fillRect(0, 0, W, H);

// 1.5) Dim-Overlay nur auf den Background anwenden
if (dimBg) {
exportCtx.save();
exportCtx.fillStyle = `rgba(0,0,0,${DIM_OVERLAY_OPACITY})`;
exportCtx.fillRect(0, 0, W, H);
exportCtx.restore();
}

- // (hier wurden früher keine Overlays gezeichnet)

* // 2) ➕ Overlay-Bilder (z. B. „Personal Images“) zeichnen
* // -> über dem Background (inkl. Dim), aber UNTER dem Text
* for (const n of overlayNodes) {
* const isGridImage = n.id.startsWith("canvas-grid-image-");
* let left: number, top: number, w: number, h: number;
*
* if (isGridImage) {
*      // Grid-Bilder liegen bereits in Canvas-Koordinaten / Zellgröße
*      left = n.x;
*      top = n.y;
*      w = n.width;
*      h = n.height;
* } else {
*      // Normale Overlays (Logos/Personal Images): contain-fit wie in der Preview
*      const nat = natSizeMap[n.id] || { w: 1, h: 1 };
*      const f = fitContain(n.width, n.height, nat.w, nat.h);
*      left = Math.round(n.x + f.x);
*      top  = Math.round(n.y + f.y);
*      w    = Math.round(f.w);
*      h    = Math.round(f.h);
* }
*
* // Bild laden und zeichnen (CORS-safe)
* // Wichtig: crossOrigin setzen, wie bereits im Preview
* // und Promise-basiert nacheinander zeichnen, um Reihenfolge stabil zu halten.
* // eslint-disable-next-line no-await-in-loop
* await new Promise<void>((res) => {
*      const img = new Image();
*      img.onload = () => {
*        try {
*          exportCtx.drawImage(img, left, top, w, h);
*        } catch {}
*        res();
*      };
*      img.onerror = () => res();
*      img.crossOrigin = "anonymous";
*      img.src = n.url;
* });
* }

- // 3) Text zeichnen …

* // 3) Text zeichnen (liegt ÜBER den Overlays)
  // (… bestehender Text-Render-Code bleibt unverändert …)
  @@

- // ➕ Overlays ins PNG rendern
- for (const n of overlayNodes) {
- const isGridImage = n.id.startsWith("canvas-grid-image-");
- // . (GANZER Block entfernt; Overlays werden jetzt VOR dem Text gezeichnet)
- }

* // (kein Overlay-Rendering mehr NACH dem Text – Overlays wurden bereits davor gezeichnet)

  return new Promise<Blob>((resolve, reject) => {
  offscreenCanvas.toBlob(
  (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
  "image/png",
  );
  });
