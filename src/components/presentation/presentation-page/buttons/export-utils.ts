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
  const content = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    streamFiles: false,
    platform: "UNIX",
  });
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

// Erzwingt Full-Frame-Export 1080x1620 (2:3) mit zentriertem Cover-Fitting
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
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  const scale = Math.max(W / img.width, H / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const dx = (W - drawWidth) / 2;
  const dy = (H - drawHeight) / 2;

  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
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
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.88),
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
