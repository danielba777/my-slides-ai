// Erzeugt eine CORS-sichere URL für ein externes Bild via Same-Origin Proxy.
// Achtung: Keine clientseitigen cross-origin fetches mehr!
const urlCache = new Map<string, string>();

export function revokeCorsSafeImageUrl(url: string) {
try {
if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
} catch {
// ignore
}
}

export function getCorsSafeImageUrl(src: string): Promise<string> | string {
if (!src) return src;
if (src.startsWith("blob:") || src.startsWith("data:") || src.startsWith("/api/proxy-image?")) {
return src;
}
if (urlCache.has(src)) return urlCache.get(src)!;

// Immer über unseren Proxy leiten => Same-Origin im Browser
const proxied = `/api/proxy-image?url=${encodeURIComponent(src)}`;
urlCache.set(src, proxied);
return proxied;
}