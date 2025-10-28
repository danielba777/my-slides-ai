Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

1. Toolbar: Vertical-Align-Button entfernen (inkl. Imports)
   **_ Begin Patch
   _** Update File: src/canvas/LegacyEditorToolbar.tsx
   @@
   -import {

- DropdownMenu,
- DropdownMenuContent,
- DropdownMenuItem,
- DropdownMenuTrigger,
  -} from "@/components/ui/dropdown-menu";
  -import {
- AlignVerticalJustifyStart,
- AlignVerticalJustifyCenter,
- AlignVerticalJustifyEnd,
  -} from "lucide-react";
  \*\*\* End Patch

Falls die Imports bei dir blockweise gruppiert sind, reicht es, nur diese Zeilen zu löschen. Andere Imports bitte unangetastet lassen.

**_ Begin Patch
_** Update File: src/canvas/LegacyEditorToolbar.tsx
@@

-          {/* Text vertical align (Dropdown wie beim horizontal Align) */}
-          <DropdownMenu>
-            <Tooltip>
-              <DropdownMenuTrigger asChild>
-                <TooltipTrigger asChild>
-                  <Button
-                    variant="ghost"
-                    size="icon"
-                    aria-label="Vertical align"
-                    className="h-9 w-9"
-                    title="Vertical align"
-                  >
-                    {selectedText?.verticalAlign === "top" && (
-                      <AlignVerticalJustifyStart className="h-4 w-4" />
-                    )}
-                    {(!selectedText?.verticalAlign ||
-                      selectedText?.verticalAlign === "center") && (
-                      <AlignVerticalJustifyCenter className="h-4 w-4" />
-                    )}
-                    {selectedText?.verticalAlign === "bottom" && (
-                      <AlignVerticalJustifyEnd className="h-4 w-4" />
-                    )}
-                  </Button>
-                </TooltipTrigger>
-              </DropdownMenuTrigger>
-              <TooltipContent>Vertical align</TooltipContent>
-            </Tooltip>
-            <DropdownMenuContent align="start">
-              <DropdownMenuItem
-                onClick={() =>
-                  selectedText &&
-                  onChangeSelectedText?.({ ...selectedText, verticalAlign: "top" })
-                }
-              >
-                <AlignVerticalJustifyStart className="mr-2 h-4 w-4" />
-                Top
-              </DropdownMenuItem>
-              <DropdownMenuItem
-                onClick={() =>
-                  selectedText &&
-                  onChangeSelectedText?.({ ...selectedText, verticalAlign: "center" })
-                }
-              >
-                <AlignVerticalJustifyCenter className="mr-2 h-4 w-4" />
-                Center
-              </DropdownMenuItem>
-              <DropdownMenuItem
-                onClick={() =>
-                  selectedText &&
-                  onChangeSelectedText?.({ ...selectedText, verticalAlign: "bottom" })
-                }
-              >
-                <AlignVerticalJustifyEnd className="mr-2 h-4 w-4" />
-                Bottom
-              </DropdownMenuItem>
-            </DropdownMenuContent>
-          </DropdownMenu>

*          {/* Vertical align wurde entfernt: Text ist immer vertikal zentriert */}
  \*\*\* End Patch

2. Export (Canvas): Text immer vertikal mittig in der Textbox zeichnen
   **_ Begin Patch
   _** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
   @@

-            // Text immer NACH allen Bildern rendern
-            ctx.save();
-            ctx.globalCompositeOperation = "source-over";
-            // Text Rendering vorbereiten
-            ctx.textBaseline = TEXT_BASELINE;
-            ctx.textAlign = alignX;
-            // vertikal exakt wie im Preview mittig zentrieren
-            const metrics = ctx.measureText(layer.text);
-            const textHeight =
-              metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
-            let y = H / 2;
-            if (layer.verticalAlign === "top") y = textHeight / 2 + 2;
-            if (layer.verticalAlign === "bottom") y = H - textHeight / 2 - 2;
-            ctx.fillText(layer.text, W / 2, y);
-            ctx.restore();

*            // Text immer NACH allen Bildern rendern
*            ctx.save();
*            ctx.globalCompositeOperation = "source-over";
*            // Text Rendering vorbereiten – IMMER vertikal zentriert in der Textbox
*            ctx.textAlign = alignX;
*            ctx.textBaseline = "middle";
*
*            // Box-Maße robust ermitteln (unterstützt verschiedene Layer-Modelle)
*            const boxY =
*              (layer as any)?.box?.y ??
*              (layer as any)?.frame?.y ??
*              (layer as any)?.y ??
*              0;
*            const boxH =
*              (layer as any)?.box?.height ??
*              (layer as any)?.frame?.height ??
*              (layer as any)?.h ??
*              (layer as any)?.height ??
*              H;
*            const centerY = Math.round(boxY + boxH / 2);
*
*            ctx.fillText(layer.text, W / 2, centerY);
*            ctx.restore();
  \*\*\* End Patch
