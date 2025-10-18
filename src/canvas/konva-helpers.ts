"use client";
import FontFaceObserver from "fontfaceobserver";

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function loadImageDecoded(url: string): Promise<HTMLImageElement> {
  const img = await loadImage(url);
  // decode() verhindert Paint-Glitches vor vollständiger Decodierung
  // Fallback: falls nicht unterstützt, ist img schon geladen
  try {
    const maybeDecode = (img as HTMLImageElement & {
      decode?: () => Promise<void>;
    }).decode;
    if (typeof maybeDecode === "function") {
      await maybeDecode.call(img);
    }
  } catch {
    // ignore
  }
  return img;
}

export async function ensureFonts(families: string[], timeout = 5000) {
  await Promise.allSettled(
    families
      .filter(Boolean)
      .map((f) => new FontFaceObserver(f!).load(null, timeout)),
  );
}

export function snapToGrid(value: number, grid = 5) {
  return Math.round(value / grid) * grid;
}
export function getSnap(x: number, y: number, grid = 5) {
  return { x: snapToGrid(x, grid), y: snapToGrid(y, grid) };
}
