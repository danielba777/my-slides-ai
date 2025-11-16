import type { CanvasDoc } from "@/lib/types";

/**
 * Stellt sicher, dass ein Canvas-Dokument alle notwendigen Felder hat.
 * Fehlende Werte werden mit Standardwerten ergänzt.
 */
export function ensureCanvas(c?: CanvasDoc | null): CanvasDoc {
  return {
    version: c?.version ?? 1,
    width: c?.width ?? 1080,
    height: c?.height ?? 1620,
    bg: c?.bg ?? "#ffffff",
    nodes: Array.isArray(c?.nodes) ? [...c!.nodes] : [],
    selection: Array.isArray(c?.selection)
      ? [...(c!.selection as any[])]
      : [],
    previewDataUrl: c?.previewDataUrl,
  };
}