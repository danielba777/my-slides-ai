Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/canvas/LegacyEditorToolbar.tsx
@@

- // --- Feste Werte für Ein-Klick-Toggles (TikTok-Style) ---
- const TIKTOK_OUTLINE_WIDTH = 6; // fixe Konturstärke

* // --- Feste Werte für Ein-Klick-Toggles (TikTok-Style) ---
* // Deutlich dicker für bessere Lesbarkeit (TikTok-typisch)
* const TIKTOK_OUTLINE_WIDTH = 12; // fixe Konturstärke
  @@

-          {/* Background toggle (100% opacity) */}
-          <Tooltip>
-            <TooltipTrigger asChild>
-              <Button
-                variant="ghost"
-                size="icon"
-                aria-label="Text background"
-                className={cn("h-9 w-9", selectedText?.bgEnabled && "bg-muted")}
-                onClick={toggleBg}
-              >
-                <IconTextBackground className="h-4 w-4" />
-              </Button>
-            </TooltipTrigger>
-            <TooltipContent>Text background</TooltipContent>
-          </Tooltip>

*          {/* Background toggle (100% opacity) */}
*          <Tooltip>
*            <TooltipTrigger asChild>
*              <Button
*                variant="ghost"
*                size="icon"
*                aria-label="Text background"
*                // nicht deaktivieren – bei Klick wird Zustand am selektierten Text gesetzt
*                className={cn("h-9 w-9", selectedText?.bgEnabled && "bg-muted")}
*                onClick={() => {
*                  if (!selectedText) return;
*                  // 100% Opazität beim Aktivieren
*                  onChangeSelectedText?.({
*                    ...selectedText,
*                    bgEnabled: !selectedText.bgEnabled,
*                    bgOpacity: 1,
*                  });
*                }}
*              >
*                <IconTextBackground className="h-4 w-4" />
*              </Button>
*            </TooltipTrigger>
*            <TooltipContent>Text background</TooltipContent>
*          </Tooltip>
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
  @@

-                          textShadow:
-                            (layer as any).outlineEnabled &&
-                            ((layer as any).outlineWidth || 0) > 0
-                              ? buildOuterTextShadow(
-                                  Math.round(
-                                    ((layer as any).outlineWidth || 6) *
-                                      layer.scale,
-                                  ),
-                                  (layer as any).outlineColor || "#000",
-                                ) + ", 0 2px 8px rgba(0,0,0,0.8)"
-                              : "0 2px 8px rgba(0,0,0,0.8)",

*                          textShadow:
*                            (layer as any).outlineEnabled &&
*                            ((layer as any).outlineWidth || 0) > 0
*                              ? buildOuterTextShadow(
*                                  Math.round(
*                                    // Fallback an TikTok-Outline-Breite angleichen
*                                    ((layer as any).outlineWidth || 12) *
*                                      layer.scale,
*                                  ),
*                                  (layer as any).outlineColor || "#000",
*                                ) + ", 0 2px 8px rgba(0,0,0,0.8)"
*                              : "0 2px 8px rgba(0,0,0,0.8)",
  \*\*\* End Patch
