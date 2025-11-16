"use client";



export function previewSignature(slide: unknown): string {
  try {
    const s = slide as {
      id?: string;
      content?: unknown;
      alignment?: unknown;
      layoutType?: unknown;
      width?: unknown;
      rootImage?: unknown;
    };
    return JSON.stringify({
      id: s?.id,
      content: s?.content,
      alignment: s?.alignment,
      layoutType: s?.layoutType,
      width: s?.width,
      rootImage: s?.rootImage,
    });
  } catch {
    return "";
  }
}
