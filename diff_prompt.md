Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@

-      } else if (mode === "resize-left" || mode === "resize-right") {
-        // Horizontal resize
-        const dx = x - pointerStart.x;
-        const delta = mode === "resize-left" ? -dx : dx;
-        const nextW = Math.max(40, layerStart.width + delta);
-        draft.forEach((l) => {
-          if (l.id !== layerStart.id) return;
-          l.width = nextW;
-          if ((l as any).autoHeight) {
-            const textH = computeAutoHeightFromUtil({
-              content: l.content,
-              baseFontPx: BASE_FONT_PX,
-              scale: l.scale,
-              lineHeight: l.lineHeight,
-              letterSpacing: l.letterSpacing,
-              maxWidthPx: nextW - PADDING * 2,
-              fontFamily: l.fontFamily ?? "Inter",
-              fontWeight:
-                l.weight === "bold" ? 700 : l.weight === "semibold" ? 600 : 400,
-              italic: (l as any).italic ?? false,
-            });
-            l.height = Math.max(40, Math.ceil(textH + PADDING * 2));
-          }
-        });
-      } else if (

*      } else if (mode === "resize-left" || mode === "resize-right") {
*        // Horizontal resize – Höhe SOFORT neu berechnen (live wrap)
*        const dx = x - pointerStart.x;
*        const delta = mode === "resize-left" ? -dx : dx;
*        const nextW = Math.max(40, layerStart.width + delta);
*        draft.forEach((l) => {
*          if (l.id !== layerStart.id) return;
*          l.width = nextW;
*          // Immer Auto-Höhe bei horizontalem Resize → direkte Anpassung bei Zeilenumbruch
*          const textH = computeAutoHeightFromUtil({
*            content: l.content,
*            baseFontPx: BASE_FONT_PX,
*            scale: l.scale,
*            lineHeight: l.lineHeight,
*            letterSpacing: l.letterSpacing,
*            maxWidthPx: nextW - PADDING * 2,
*            fontFamily: l.fontFamily ?? "Inter",
*            fontWeight:
*              l.weight === "bold" ? 700 : l.weight === "semibold" ? 600 : 400,
*            italic: (l as any).italic ?? false,
*          });
*          l.height = Math.max(40, Math.ceil(textH + PADDING * 2));
*          (l as any).autoHeight = true;
*        });
*      } else if (
           mode.startsWith("resize-") &&
           (mode.endsWith("nw") ||
             mode.endsWith("ne") ||
             mode.endsWith("sw") ||
             mode.endsWith("se"))
         ) {
  \*\*\* End Patch
