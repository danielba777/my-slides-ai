Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@
} else if (
mode.startsWith("resize-") &&
(mode.endsWith("nw") ||
mode.endsWith("ne") ||
mode.endsWith("sw") ||
mode.endsWith("se"))
) {

-        // === Corner resize: keep aspect & scale text ===
-        // Convert pointer delta into local coords respecting rotation
-        const center = { x: layerStart.x, y: layerStart.y };
-        const p0 = rotatePoint(
-          pointerStart.x - center.x,
-          pointerStart.y - center.y,
-          -layerStart.rotation,
-        );
-        const p1 = rotatePoint(
-          x - center.x,
-          y - center.y,
-          -layerStart.rotation,
-        );
-        const startLen = Math.hypot(p0.x, p0.y) || 1;
-        const currLen = Math.hypot(p1.x, p1.y) || 1;
-        const s = currLen / startLen;
-
-        const nextScale = Math.max(0.2, layerStart.scale * s);
-        // Width/height update (kept before, but we'll tighten)
-        let nextW = Math.max(40, layerStart.width * s);
-        let nextH = Math.max(40, layerStart.height * s);
-
-        // Apply changes
-        draft.forEach((l) => {
-          if (l.id !== layerStart.id) return;
-          l.scale = nextScale;
-          l.width = nextW;
-          if ((l as any).autoHeight) {
-            const textH = computeAutoHeightFromUtil({
-              content: l.content,
-              baseFontPx: BASE_FONT_PX,
-              scale: nextScale,
-              lineHeight: l.lineHeight,
-              letterSpacing: l.letterSpacing,
-              maxWidthPx: l.width - PADDING * 2,
-              fontFamily: l.fontFamily ?? "Inter",
-              fontWeight:
-                l.weight === "bold" ? 700 : l.weight === "semibold" ? 600 : 400,
-              italic: (l as any).italic ?? false,
-            });
-            l.height = Math.max(40, Math.ceil(textH + PADDING * 2));
-          } else {
-            l.height = nextH;
-          }
-        });

*        // === Corner resize: scale ONLY the text (hug width), auto-height ===
*        const center = { x: layerStart.x, y: layerStart.y };
*        const p0 = rotatePoint(
*          pointerStart.x - center.x,
*          pointerStart.y - center.y,
*          -layerStart.rotation,
*        );
*        const p1 = rotatePoint(
*          x - center.x,
*          y - center.y,
*          -layerStart.rotation,
*        );
*
*        const startLen = Math.hypot(p0.x, p0.y) || 1;
*        const currLen = Math.hypot(p1.x, p1.y) || 1;
*        const s = currLen / startLen;
*
*        const nextScale = Math.max(0.2, layerStart.scale * s);
*
*        draft.forEach((l) => {
*          if (l.id !== layerStart.id) return;
*
*          // Breite bleibt fix – Text soll Box nicht aufblasen
*          const keepW = Math.max(40, layerStart.width);
*          l.scale = nextScale;
*          l.width = keepW;
*
*          // Höhe immer neu aus Text berechnen (hug content)
*          const textH = computeAutoHeightFromUtil({
*            content: l.content,
*            baseFontPx: BASE_FONT_PX,
*            scale: nextScale,
*            lineHeight: l.lineHeight,
*            letterSpacing: l.letterSpacing,
*            maxWidthPx: keepW - PADDING * 2,
*            fontFamily: l.fontFamily ?? "Inter",
*            fontWeight:
*              l.weight === "bold" ? 700 : l.weight === "semibold" ? 600 : 400,
*            italic: (l as any).italic ?? false,
*          });
*
*          l.height = Math.max(40, Math.ceil(textH + PADDING * 2));
*          (l as any).autoHeight = true;
*        });
  @@
  // === EXPORT ===
  exportPNG: async () => {
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return new Blob();
           // Clear
           ctx.clearRect(0, 0, W, H);

           // Draw image
           if (imageUrl && imgRef.current && imgRef.current.complete) {
             const img = imgRef.current;
             ctx.save();
             ctx.translate(W / 2, H / 2);
             ctx.translate(offset.x, offset.y);
             ctx.scale(Math.max(0.001, scale), Math.max(0.001, scale));
             ctx.drawImage(img, -img.width / 2, -img.height / 2);
             ctx.restore();
           } else if (!imageUrl) {
             ctx.fillStyle = "black";
             ctx.fillRect(0, 0, W, H);
           }

-        // Draw texts

*        // Draw texts (skip fully off-canvas)
         textLayers.forEach((l) => {
*          const halfW = (l.width * l.scale) / 2;
*          const halfH = (l.height * l.scale) / 2;
*          const left = l.x - halfW;
*          const right = l.x + halfW;
*          const top = l.y - halfH;
*          const bottom = l.y + halfH;
*
*          const fullyOutside =
*            right < 0 || left > W || bottom < 0 || top > H;
*          if (fullyOutside) return;
  \*\*\* End Patch

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@

-                  {/* === Handles INSIDE the box so they inherit rotation/scale and stay attached === */}

*                  {/* === Handles (größer + modernere Hitbox) INSIDE der Box === */}
                   {isActive && !isCurrentEditing && (
                     <div
                       className="absolute inset-0"
                       style={{ pointerEvents: "none" }}
                     >

-                      {/* Corners */}

*                      {/* ---- Ecken (größere Handles) ---- */}
                       <div
                         data-role="handle"
                         title="Größe proportional ändern"

-                        className="absolute top-0 left-0 w-5 h-5 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize flex items-center justify-center"

*                        className="absolute top-0 left-0 w-7 h-7 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize flex items-center justify-center"
                         style={{ pointerEvents: "auto" }}
                         onPointerDown={(e) => startResize(layer.id, 'resize-nw', e)}
                       >

-                        <div className="h-3 w-3 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />

*                        <div className="h-4 w-4 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />
                       </div>
                       <div
                         data-role="handle"
                         title="Größe proportional ändern"

-                        className="absolute top-0 right-0 w-5 h-5 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize flex items-center justify-center"

*                        className="absolute top-0 right-0 w-7 h-7 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize flex items-center justify-center"
                         style={{ pointerEvents: "auto" }}
                         onPointerDown={(e) => startResize(layer.id, 'resize-ne', e)}
                       >

-                        <div className="h-3 w-3 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />

*                        <div className="h-4 w-4 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />
                       </div>
                       <div
                         data-role="handle"
                         title="Größe proportional ändern"

-                        className="absolute bottom-0 left-0 w-5 h-5 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize flex items-center justify-center"

*                        className="absolute bottom-0 left-0 w-7 h-7 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize flex items-center justify-center"
                         style={{ pointerEvents: "auto" }}
                         onPointerDown={(e) => startResize(layer.id, 'resize-sw', e)}
                       >

-                        <div className="h-3 w-3 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />

*                        <div className="h-4 w-4 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />
                       </div>
                       <div
                         data-role="handle"
                         title="Größe proportional ändern"

-                        className="absolute bottom-0 right-0 w-5 h-5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize flex items-center justify-center"

*                        className="absolute bottom-0 right-0 w-7 h-7 translate-x-1/2 translate-y-1/2 cursor-nwse-resize flex items-center justify-center"
                         style={{ pointerEvents: "auto" }}
                         onPointerDown={(e) => startResize(layer.id, 'resize-se', e)}
                       >

-                        <div className="h-3 w-3 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />

*                        <div className="h-4 w-4 rounded-full bg-white border border-blue-500 shadow-sm pointer-events-none" />
                       </div>

-                      {/* Sides */}

*                      {/* ---- Seiten (größere Balken-Handles) ---- */}
                       <div
                         data-role="handle"
                         title="Breite ändern (links)"

-                        className="absolute left-0 top-1/2 w-5 h-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center"

*                        className="absolute left-0 top-1/2 w-7 h-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center"
                         style={{ pointerEvents: "auto" }}
                         onPointerDown={(e) => startResize(layer.id, 'resize-left', e)}
                       >

-                        <div className="h-6 w-2 rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />

*                        <div className="h-7 w-[10px] rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                       </div>
                       <div
                         data-role="handle"
                         title="Breite ändern (rechts)"

-                        className="absolute right-0 top-1/2 w-5 h-8 translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center"

*                        className="absolute right-0 top-1/2 w-7 h-10 translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center"
                         style={{ pointerEvents: "auto" }}
                         onPointerDown={(e) => startResize(layer.id, 'resize-right', e)}
                       >

-                        <div className="h-6 w-2 rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />

*                        <div className="h-7 w-[10px] rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                         </div>
  \*\*\* End Patch
