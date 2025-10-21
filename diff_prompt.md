Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@
const [scale, setScale] = useState(1);
const [offset, setOffset] = useState({ x: 0, y: 0 });
const [bgSelected, setBgSelected] = useState(false);

- const [imageNatural, setImageNatural] = useState<{ w: number; h: number } | null>(null);
  const isPanning = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  @@

* const wheelHandler = useCallback((e: WheelEvent) => {
* if (isEditingRef.current) return;
* if (!bgSelected) return;
* e.preventDefault();
* e.stopPropagation();
* if (!wrapRef.current) return;
* const rect = wrapRef.current.getBoundingClientRect();
* const canvasX = (e.clientX - rect.left) \* (W / rect.width);
* const canvasY = (e.clientY - rect.top) \* (H / rect.height);
* const factor = e.deltaY < 0 ? 1.06 : 0.94;
*
* setScale((prev) => {
*      const newScale = Math.max(0.4, Math.min(3, prev * factor));
*      const scaleDiff = newScale - prev;
*      setOffset((o) => {
*        const offsetX = ((canvasX - W / 2 - o.x) * scaleDiff) / prev;
*        const offsetY = ((canvasY - H / 2 - o.y) * scaleDiff) / prev;
*        return { x: o.x - offsetX, y: o.y - offsetY };
*      });
*      return newScale;
* });
* }, []);

- const wheelHandler = useCallback((e: WheelEvent) => {
- if (isEditingRef.current) return;
- if (!bgSelected) return;
- e.preventDefault();
- e.stopPropagation();
- if (!wrapRef.current) return;
- const rect = wrapRef.current.getBoundingClientRect();
- const canvasX = (e.clientX - rect.left) \* (W / rect.width);
- const canvasY = (e.clientY - rect.top) \* (H / rect.height);
- const factor = e.deltaY < 0 ? 1.06 : 0.94;
-
- setScale((prev) => {
-      const newScale = Math.max(0.4, Math.min(3, prev * factor));
-      const scaleDiff = newScale - prev;
-      setOffset((o) => {
-        const offsetX = ((canvasX - W / 2 - o.x) * scaleDiff) / prev;
-        const offsetY = ((canvasY - H / 2 - o.y) * scaleDiff) / prev;
-        return { x: o.x - offsetX, y: o.y - offsetY };
-      });
-      return newScale;
- });
- }, [bgSelected]);
  @@
  useEffect(() => {
  const el = wrapRef.current;
  if (!el) return;
  el.addEventListener("wheel", wheelHandler, { passive: false });
  return () => el.removeEventListener("wheel", wheelHandler as any);

* }, [wheelHandler, bgSelected]);

- }, [wheelHandler, bgSelected]);
  @@

*          {imageUrl ? (
*            <>
*              <img
*                ref={imgRef}
*                src={imageUrl}
*                alt=""
*                className="absolute left-1/2 top-1/2 select-none pointer-events-none"
*                style={{
*                  transform: `translate(-50%,-50%) translate(${offset.x}px, ${offset.y}px) scale(${Math.max(
*                    0.001,
*                    scale,
*                  )})`,
*                  transformOrigin: "center",
*                }}
*                draggable={false}
*                onLoad={(e) => {
*                  // Beim ersten Laden: Bild so skalieren, dass es KOMPLETT sichtbar ist (contain)
*                  try {
*                    const n = e.currentTarget as HTMLImageElement;
*                    const fit = Math.min(W / n.naturalWidth, H / n.naturalHeight);
*                    setScale((prev) => (prev === 1 ? fit : prev));
*                  } catch {}
*                }}
*              />
*              {bgSelected && (
*                <div
*                  className="absolute left-1/2 top-1/2 pointer-events-none"
*                  style={{
*                    transform: `translate(-50%,-50%) translate(${offset.x}px, ${offset.y}px) scale(${Math.max(
*                      0.001,
*                      scale,
*                    )})`,
*                    transformOrigin: "center",
*                    width: W,
*                    height: H,
*                    boxSizing: "border-box",
*                    border: "2px dashed rgba(59,130,246,0.9)", /* blue-500 */
*                    borderRadius: "8px",
*                  }}
*                />
*              )}
*            </>
*          ) : (

-          {imageUrl ? (
-            <>
-              <img
-                ref={imgRef}
-                src={imageUrl}
-                alt=""
-                className="absolute left-1/2 top-1/2 select-none pointer-events-none"
-                style={{
-                  transform: `translate(-50%,-50%) translate(${offset.x}px, ${offset.y}px) scale(${Math.max(
-                    0.001,
-                    scale
-                  )})`,
-                  transformOrigin: "center",
-                }}
-                draggable={false}
-                onLoad={(e) => {
-                  try {
-                    const n = e.currentTarget as HTMLImageElement;
-                    setImageNatural({ w: n.naturalWidth, h: n.naturalHeight });
-                    const fit = Math.min(W / n.naturalWidth, H / n.naturalHeight);
-                    setScale((prev) => (prev === 1 ? fit : prev));
-                  } catch {}
-                }}
-              />
-              {bgSelected && imageNatural && (
-                <div
-                  className="absolute left-1/2 top-1/2 pointer-events-none"
-                  style={{
-                    transform: `translate(-50%,-50%) translate(${offset.x}px, ${offset.y}px) scale(${Math.max(
-                      0.001,
-                      scale
-                    )})`,
-                    transformOrigin: "center",
-                    width: imageNatural.w,
-                    height: imageNatural.h,
-                    boxSizing: "border-box",
-                    border: "2px dashed rgba(59,130,246,0.9)",
-                    borderRadius: "8px",
-                  }}
-                />
-              )}
-            </>
-          ) : (
               <div className="absolute inset-0 bg-black" />
             )}
  @@

* const centerX = W / 2;
* const centerY = H / 2;

- const centerX = W / 2;
- const oneThirdY = Math.round(H / 3);
  @@
  align: "center",

*      x: centerX,
*      y: centerY,

-      x: centerX,
-      y: oneThirdY,
       rotation: 0,

*      width: 600,

-      width: Math.round(W * 0.7),
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/canvas/SlideCanvasAdapter.tsx
  @@

*          const pxX = Math.round((src.x ?? 0.5) * W);
*          const pxY = Math.round((src.y ?? 0.5) * H);

-          const pxX = Math.round((src.x ?? 0.5) * W);
-          const pxY = Math.round((src.y ?? (1 / 3)) * H);
  @@
  rotation: src.rotation ?? 0,

*            width: src.maxWidth ?? 400,

-            width: src.maxWidth ?? Math.round(W * 0.7),
             text: src.content ?? "",
             fontFamily: src.fontFamily ?? "Inter, system-ui, sans-serif",
             fontSize: Math.round(BASE_FONT_PX * (src.scale ?? 1)),
             lineHeight: src.lineHeight ?? 1.12,
             letterSpacing: src.letterSpacing ?? 0,

*            align: src.align ?? "left",

-            align: src.align ?? "center",
  \*\*\* End Patch
