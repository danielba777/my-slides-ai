Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/components/presentation/presentation-page/buttons/DownloadSlidesButton.tsx
@@
-async function blobToJpeg(pngBlob: Blob): Promise<Blob> {

- // PNG -> JPEG (ohne Größenänderung) via Offscreen Canvas
- const dataUrl = await new Promise<string>((resolve) => {
- const reader = new FileReader();
- reader.onload = () => resolve(String(reader.result));
- reader.readAsDataURL(pngBlob);
- });
- const img = await new Promise<HTMLImageElement>((resolve, reject) => {
- const i = new Image();
- i.crossOrigin = "anonymous";
- i.onload = () => resolve(i);
- i.onerror = reject;
- i.src = dataUrl;
- });
- const canvas = document.createElement("canvas");
- canvas.width = img.naturalWidth;
- canvas.height = img.naturalHeight;
- const ctx = canvas.getContext("2d")!;
- ctx.drawImage(img, 0, 0);
- const blob = await new Promise<Blob | null>((resolve) =>
- canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
- );
- return blob ?? pngBlob;
  -}
  +// Lädt einen Blob als HTMLImageElement
  +async function loadBlobAsImage(blob: Blob): Promise<HTMLImageElement> {

* const dataUrl = await new Promise<string>((resolve) => {
* const r = new FileReader();
* r.onload = () => resolve(String(r.result));
* r.readAsDataURL(blob);
* });
* return await new Promise<HTMLImageElement>((resolve, reject) => {
* const img = new Image();
* img.crossOrigin = "anonymous";
* img.onload = () => resolve(img);
* img.onerror = reject;
* img.src = dataUrl;
* });
  +}
* +// Erzwingt Full-Frame-Export 1080x1920 und harten Rand-Clip (kein „mittendrin“-Crop)
  +async function normalizeToDesignPNG(pngBlob: Blob, W = 1080, H = 1920): Promise<Blob> {
* const img = await loadBlobAsImage(pngBlob);
* const canvas = document.createElement("canvas");
* canvas.width = W;
* canvas.height = H;
* const ctx = canvas.getContext("2d")!;
* // harter Frame-Clip (0,0,W,H)
* ctx.save();
* ctx.beginPath();
* ctx.rect(0, 0, W, H);
* ctx.clip();
* // Wichtig: Alles 1:1 in den Frame zeichnen.
* // Falls das Quellbild nicht exakt W×H hat (z.B. wegen Preview-Zoom),
* // wird hier proportional auf den Ziel-Frame gelegt.
* // Wenn deine Canvas bereits W×H ist, ist das ein 1:1 Draw ohne Shift.
* ctx.drawImage(img, 0, 0, W, H);
* ctx.restore();
* const out = await new Promise<Blob | null>((resolve) =>
* canvas.toBlob((b) => resolve(b), "image/png"),
* );
* return out ?? pngBlob;
  +}
* +async function blobToJpeg(pngBlob: Blob, W = 1080, H = 1920): Promise<Blob> {
* // Erst sicherstellen, dass wir exakt den vollen Frame (1080×1920) haben
* const normalized = await normalizeToDesignPNG(pngBlob, W, H);
* const img = await loadBlobAsImage(normalized);
* const canvas = document.createElement("canvas");
* canvas.width = W;
* canvas.height = H;
* const ctx = canvas.getContext("2d")!;
* ctx.drawImage(img, 0, 0, W, H);
* const jpg = await new Promise<Blob | null>((resolve) =>
* canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
* );
* return jpg ?? normalized;
  +}
  @@
  const handleDownload = async () => {
  try {
  setDownloading(true);
  const exporters: Map<string, () => Promise<Blob>> = (window as any).\_\_slideExporters ?? new Map();
  // sichere Reihenfolge (aktuelle UI-Reihenfolge im State)
  const ordered = slides.map((s, idx) => ({ id: s.id as string, idx }));
  const jpgFiles: Array<{ name: string; blob: Blob }> = [];
  for (const { id, idx } of ordered) {
  const exporter = exporters.get(id);
  if (!exporter) continue;

-        const png = await exporter();
-        const jpg = await blobToJpeg(png);

*        const png = await exporter();
*        // Erzwinge Full-Frame 1080×1920 + Rand-Clip, danach nach JPG
*        const jpg = await blobToJpeg(png, 1080, 1920);
           const name = `${String(idx + 1).padStart(2, "0")}.jpg`;
           jpgFiles.push({ name, blob: jpg });
         }
  \*\*\* End Patch
