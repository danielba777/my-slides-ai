

const urlCache = new Map<string, string>();

export function revokeCorsSafeImageUrl(url: string) {
try {
if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
} catch {

}
}

export function getCorsSafeImageUrl(src: string): Promise<string> | string {
if (!src) return src;
if (src.startsWith("blob:") || src.startsWith("data:") || src.startsWith("/api/proxy-image?")) {
return src;
}
if (urlCache.has(src)) return urlCache.get(src)!;


const proxied = `/api/proxy-image?url=${encodeURIComponent(src)}`;
urlCache.set(src, proxied);
return proxied;
}