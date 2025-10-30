"use client";

/**
 * Utility helpers for exporting slides to PNG/JPG/ZIP blobs.
 */

// JSZip wird lazy geladen, damit der initiale Bundle klein bleibt
export async function zipFiles(
  files: Array<{ name: string; blob: Blob }>,
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.name, f.blob);
  }
  const content = await zip.generateAsync({ type: "blob" });
  return content;
}

// Lädt einen Blob als HTMLImageElement
export async function loadBlobAsImage(blob: Blob): Promise<HTMLImageElement> {
  const dataUrl = await blobToDataUrl(blob);
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Erzwingt Full-Frame-Export 1080x1620 (2:3) und harten Rand-Clip (kein „mittendrin"-Crop)
export async function normalizeToDesignPNG(
  pngBlob: Blob,
  W = 1080,
  H = 1620,
): Promise<Blob> {
  const img = await loadBlobAsImage(pngBlob);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // harter Frame-Clip (0,0,W,H)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  // Wichtig: Alles 1:1 in den Frame zeichnen.
  ctx.drawImage(img, 0, 0, W, H);
  ctx.restore();
  const out = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  return out ?? pngBlob;
}

export async function blobToJpeg(
  pngBlob: Blob,
  W = 1080,
  H = 1620,
): Promise<Blob> {
  // Erst sicherstellen, dass wir exakt den vollen Frame (1080×1620, 2:3) haben
  const normalized = await normalizeToDesignPNG(pngBlob, W, H);
  const img = await loadBlobAsImage(normalized);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, W, H);
  const jpg = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
  );
  return jpg ?? normalized;
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("Failed to convert blob to data URL"));
    reader.readAsDataURL(blob);
  });
}
