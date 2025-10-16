Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

Diffs (minimal-invasiv, passend zu deiner Legacy-Datei)

_ Begin Patch
_ Update File: src/canvas/legacy/SlideCanvasLegacy.tsx

@@
-import { GripVertical } from "lucide-react";
+import { GripVertical, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import LegacyEditorToolbar from "@/canvas/LegacyEditorToolbar";
@@
const handleAddText = useCallback(() => {
addNewTextLayer();
}, [textLayers]);

- // --- SAFE input handlers ---
- const handleLineHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
- const v = parseFloat(e.currentTarget.value);
- if (!Number.isFinite(v)) return;
- applyToActive((l) => ({ ...l, lineHeight: v }));
- };
-
- const handleOutlineWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
- const v = parseFloat(e.currentTarget.value);
- if (!Number.isFinite(v)) return;
- applyToActive((l: any) => ({ ...l, outlineEnabled: v > 0, outlineWidth: v }));
- };
-
- const setOutlineColor = (color: string) => {
- applyToActive((l: any) => ({ ...l, outlineEnabled: true, outlineColor: color }));
- };
- return (
  <>
  {/_ Obere Toolbar (immer sichtbar) _/}
  <div
  className="sticky top-0 z-50 w-full bg-transparent"
  @@

*        {/* === BEGIN: LEGACY CONTROLS (JETZT VERDRAHTET) === */}
*
*        {/* Typo-Gruppe: Fett, Kursiv, etc. */}
*        <div className="flex items-center gap-2">

-        {/* === BEGIN: LEGACY CONTROLS (NEU ANGERICHTET) === */}
-
-        {/* --- ZEILE 1: Typo & Ausrichtung & Größe --- */}
-        <div className="flex items-center gap-2">
           <button
             onClick={toggleBold}
             className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/90 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
             aria-label="Fett"
             title="Fett"
           >B</button>
           <button
             onClick={toggleItalic}
             className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/90 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
             aria-label="Kursiv"
             title="Kursiv"
           >
             <span className="italic">I</span>
           </button>
         </div>

*        <div className="flex items-center gap-2">
*          <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/90 shadow-sm hover:bg-muted"
*            aria-label="Links ausrichten" title="Links ausrichten"
*            onClick={() => setAlign("left")}>↤</button>
*          <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/90 shadow-sm hover:bg-muted"
*            aria-label="Zentrieren" title="Zentrieren"
*            onClick={() => setAlign("center")}>⎯</button>
*          <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/90 shadow-sm hover:bg-muted"
*            aria-label="Rechts ausrichten" title="Rechts ausrichten"
*            onClick={() => setAlign("right")}>↦</button>
*        </div>

-        {/* Ausrichtung mit „mehrzeiligen“ Icons */}
-        <div className="flex items-center gap-2" aria-label="Textausrichtung">
-          <button
-            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/90 shadow-sm hover:bg-muted"
-            aria-label="Links ausrichten" title="Links ausrichten"
-            onClick={() => setAlign("left")}
-          >
-            <AlignLeft className="h-4 w-4" />
-          </button>
-          <button
-            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/90 shadow-sm hover:bg-muted"
-            aria-label="Zentrieren" title="Zentrieren"
-            onClick={() => setAlign("center")}
-          >
-            <AlignCenter className="h-4 w-4" />
-          </button>
-          <button
-            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/90 shadow-sm hover:bg-muted"
-            aria-label="Rechts ausrichten" title="Rechts ausrichten"
-            onClick={() => setAlign("right")}
-          >
-            <AlignRight className="h-4 w-4" />
-          </button>
-        </div>

*        {/* Font-Scale (beeinflusst FontSize = BASE_FONT_PX * scale) */}
*        <input
*          type="number"
*          step="0.05"
*          min="0.2"
*          max="4"
*          onChange={(e) => setFontScale(parseFloat(e.currentTarget.value))}
*          className="h-8 w-16 rounded-md border border-border bg-background px-2 text-sm" />

-        {/* Größe × (Scale) */}
-        <div className="flex items-center gap-2">
-          <label className="text-xs text-muted-foreground">Größe ×</label>
-          <input
-            type="number"
-            step="0.05"
-            min="0.2"
-            max="4"
-            onChange={(e) => setFontScale(parseFloat(e.currentTarget.value))}
-            className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm"
-          />
-        </div>
-
-        {/* Zeilenumbruch zu Zeile 2 */}
-        <div className="basis-full h-0" />

*        {/* Slider: Zeilenhöhe */}
*        <input
*          type="range"
*          min="0.8"
*          max="2"
*          step="0.02"
*          onChange={handleLineHeightChange}
*          className="h-1.5 w-28 accent-primary" />

-        {/* --- ZEILE 2: Abstände & Farben --- */}
-        {/* Zeilenhöhe (Input) */}
-        <div className="flex items-center gap-2">
-          <label className="text-xs text-muted-foreground">Zeilenhöhe</label>
-          <input
-            type="number"
-            min="0.8"
-            max="2"
-            step="0.02"
-            onChange={handleLineHeightChange}
-            className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm"
-          />
-        </div>
-
-        {/* Konturbreite (Slider) */}
-        <div className="flex items-center gap-2">
-          <label className="text-xs text-muted-foreground">Konturbreite</label>
-          <input
-            type="range"
-            min="0"
-            max="12"
-            step="0.5"
-            onChange={handleOutlineWidthChange}
-            className="h-1.5 w-32 accent-primary"
-          />
-        </div>

*        {/* Farbe 1 (Text) */}
*        <div className="flex items-center gap-2">
*           <label className="text-xs text-muted-foreground">Text</label>
*           <input
*             type="color"
*            onChange={(e) => setTextColor(e.currentTarget.value)}
*            className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5" />
*         </div>

-        {/* Textfarbe */}
-        <div className="flex items-center gap-2">
-          <label className="text-xs text-muted-foreground">Text</label>
-          <input
-            type="color"
-            onChange={(e) => setTextColor(e.currentTarget.value)}
-            className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5"
-          />
-        </div>

*        {/* Farbe 2 (Outline) */}
*        <input
*          type="color"
*          onChange={(e) => setOutlineColor(e.currentTarget.value)}
*          className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5" />

-        {/* Konturfarbe */}
-        <div className="flex items-center gap-2">
-          <label className="text-xs text-muted-foreground">Kontur</label>
-          <input
-            type="color"
-            onChange={(e) => setOutlineColor(e.currentTarget.value)}
-            className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5"
-          />
-        </div>

*        {/* === END: LEGACY CONTROLS === */}

-        {/* === END: LEGACY CONTROLS === */}
         </LegacyEditorToolbar>
       </div>

\_ End Patch
