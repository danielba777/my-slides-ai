Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@
// Text Rendering vorbereiten
ctx.textBaseline = TEXT_BASELINE;
ctx.textAlign = alignX;

-            ctx.fillText(layer.text, W / 2, H / 2);

*            // vertikal exakt wie im Preview mittig zentrieren
*            const metrics = ctx.measureText(layer.text);
*            const textHeight =
*              metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
*            let y = H / 2;
*            if (layer.verticalAlign === "top") y = textHeight / 2 + 2;
*            if (layer.verticalAlign === "bottom") y = H - textHeight / 2 - 2;
*            ctx.fillText(layer.text, W / 2, y);
  **_ End Patch
  arduino
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/canvas/LegacyEditorToolbar.tsx
  @@
  const IconTextBackgroundA = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
  viewBox="0 0 24 24"
  width="1em"
  height="1em"
  aria-hidden="true"
  {...props}
  >

- <rect
-      x="3.5"
-      y="6.5"
-      width="17"
-      height="11"
-      rx="2.5"
-      fill="currentColor"
-      opacity="0.25"
- > </rect>
- <text
-      x="12"
-      y="15"
-      textAnchor="middle"
-      fontWeight="700"
-      fontSize="14"
-      fill="#fff"
- >
-      A
- </text>

* {/_ vollständig schwarze Box _/}
* <rect
*      x="3"
*      y="5"
*      width="18"
*      height="14"
*      rx="3"
*      fill="#000"
* />
* <text
*      x="12"
*      y="15"
*      textAnchor="middle"
*      fontWeight="800"
*      fontSize="14"
*      fill="#fff"
* >
*      A
* </text>
     </svg>
   );
  *** End Patch
  javascript
  Code kopieren
  *** Begin Patch
  *** Update File: src/canvas/LegacyEditorToolbar.tsx
  @@
             {/* Text horizontal align */}
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant="ghost"
                   size="icon"
                   aria-label="Text align"
                   className="h-9 w-9"
                   onClick={toggleTextAlign}
                   title="Text align"
                 >
                   <AlignHorizontalJustifyCenter className="h-4 w-4" />
                 </Button>
               </TooltipTrigger>
               <TooltipContent>Text align</TooltipContent>
             </Tooltip>
*
*          {/* Text vertical align */}
*          <Tooltip>
*            <TooltipTrigger asChild>
*              <Button
*                variant="ghost"
*                size="icon"
*                aria-label="Vertical align"
*                className="h-9 w-9"
*                onClick={toggleVerticalAlign}
*                title="Vertical align"
*              >
*                {selectedText?.verticalAlign === "top" && (
*                  <AlignVerticalJustifyStart className="h-4 w-4" />
*                )}
*                {selectedText?.verticalAlign === "center" && (
*                  <AlignVerticalJustifyCenter className="h-4 w-4" />
*                )}
*                {selectedText?.verticalAlign === "bottom" && (
*                  <AlignVerticalJustifyEnd className="h-4 w-4" />
*                )}
*              </Button>
*            </TooltipTrigger>
*            <TooltipContent>Vertical align</TooltipContent>
*          </Tooltip>
  **_ End Patch
  javascript
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
  @@
  if (isPersonalImageEditingMode) {

-          // Zoom Handling aktivieren
-          const onWheel = (e: WheelEvent) => {
-            e.preventDefault();
-            const delta = e.deltaY * -0.01;
-            const newZoom = Math.min(Math.max(zoom + delta, 0.5), 3);
-            setZoom(newZoom);
-          };
-          window.addEventListener("wheel", onWheel, { passive: false });
-          return () => window.removeEventListener("wheel", onWheel);

*          // Zoom Handling aktivieren, aber Seiten-Scroll verhindern
*          const onWheel = (e: WheelEvent) => {
*            e.preventDefault();
*            e.stopPropagation();
*            const delta = e.deltaY * -0.01;
*            const newZoom = Math.min(Math.max(zoom + delta, 0.5), 3);
*            setZoom(newZoom);
*          };
*          window.addEventListener("wheel", onWheel, { passive: false });
*          return () => window.removeEventListener("wheel", onWheel);
           }
  \*\*\* End Patch
