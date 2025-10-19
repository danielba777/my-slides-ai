// Erzeugt eine CORS-sichere blob:-URL für ein externes Bild,
// damit die Canvas beim Export nicht "tainted" wird.
// Minimal-invasiv, ohne Backend-/Header-Anpassungen.
const urlCache = new Map<string, string>();

export async function getCorsSafeImageUrl(src: string): Promise<string> {
  if (!src) return src;
  // Bereits sicher oder lokal
  if (src.startsWith("blob:") || src.startsWith("data:")) return src;
  // Cache-Hit
  if (urlCache.has(src)) return urlCache.get(src)!;

  const res = await fetch(src, { mode: "cors", credentials: "omit" });
  if (!res.ok) {
    // Fallback: Original-URL (Export könnte scheitern, aber wir brechen nicht UI)
    return src;
  }
  const blob = await res.blob();
  const safe = URL.createObjectURL(blob);
  urlCache.set(src, safe);
  return safe;
}

export function revokeCorsSafeImageUrl(safeUrl: string) {
  try {
    if (safeUrl?.startsWith("blob:")) URL.revokeObjectURL(safeUrl);
  } catch {}
}