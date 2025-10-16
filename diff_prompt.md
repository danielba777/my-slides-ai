Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

Unten sind die exakten Diffs für deine aktuellen Dateien.

Betroffene Dateien (aus deinem Projektstand):
src/canvas/legacy/SlideCanvasLegacy.tsx

codebase

src/canvas/LegacyEditorToolbar.tsx

codebase

Diff 1 — src/canvas/legacy/SlideCanvasLegacy.tsx
**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@
-import { GripVertical, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
+import { GripVertical, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import LegacyEditorToolbar from "@/canvas/LegacyEditorToolbar";
@@
const handleAddText = useCallback(() => {
addNewTextLayer();
}, [textLayers]);

- // --- UI Highlight States (lokal, robust) ---
- const [uiBold, setUiBold] = useState(false);
- const [uiItalic, setUiItalic] = useState(false);
- const [uiAlign, setUiAlign] = useState<"left" | "center" | "right">("left");
- const [uiOutlineOn, setUiOutlineOn] = useState(true);

* // --- UI-States: werden aus dem aktiven Layer gespiegelt ---
* const [uiBold, setUiBold] = useState(false);
* const [uiItalic, setUiItalic] = useState(false);
* const [uiAlign, setUiAlign] = useState<"left" | "center" | "right">("left");
* const [uiOutlineOn, setUiOutlineOn] = useState(true);
* const [uiScale, setUiScale] = useState<number>(1);
* const [uiLineHeight, setUiLineHeight] = useState<number>(1.12);
* const [uiOutlineWidth, setUiOutlineWidth] = useState<number>(6);
* const [uiTextColor, setUiTextColor] = useState<string>("#ffffff");
* const [uiOutlineColor, setUiOutlineColor] = useState<string>("#000000");

  const toggleBoldUI = () => { setUiBold(v => !v); toggleBold(); };
  const toggleItalicUI = () => { setUiItalic(v => !v); toggleItalic(); };
  const setAlignUI = (a: "left" | "center" | "right") => { setUiAlign(a); setAlign(a); };

  const handleToggleOutlineOn = (e: React.ChangeEvent<HTMLInputElement>) => {
  const on = e.currentTarget.checked;
  setUiOutlineOn(on);
  applyToActive((l: any) => ({
  ...l,
  outlineEnabled: on,
  // Falls eingeschaltet aber Breite 0, kleinen Default setzen:
  outlineWidth: on ? (l.outlineWidth && l.outlineWidth > 0 ? l.outlineWidth : 4) : 0,
  }));
  };

* // Werte synchronisieren, wenn aktiver Layer wechselt oder verändert wird
* useEffect(() => {
* if (!active) return;
* const isBold = active.weight === "bold";
* const isItalic = !!(active as any).italic;
* setUiBold(isBold);
* setUiItalic(isItalic);
* setUiAlign(active.align ?? "left");
* setUiScale(Number.isFinite(active.scale) ? active.scale : 1);
* setUiLineHeight(active.lineHeight ?? 1.12);
* const outlineEnabled = (active as any).outlineEnabled ?? ((active as any).outlineWidth ?? 0) > 0;
* setUiOutlineOn(!!outlineEnabled);
* setUiOutlineWidth((active as any).outlineWidth ?? 0);
* setUiTextColor((active as any).color ?? "#ffffff");
* setUiOutlineColor((active as any).outlineColor ?? "#000000");
* }, [active?.id, active?.weight, (active as any)?.italic, active?.align, active?.scale, active?.lineHeight, (active as any)?.outlineEnabled, (active as any)?.outlineWidth, (active as any)?.color, (active as any)?.outlineColor, textLayers]);
*
* // Änderungen aus Inputs -> Layer + UI-State spiegeln
* const handleScaleChange = (value: number) => {
* if (!Number.isFinite(value)) return;
* const s = Math.max(0.2, Math.min(4, value));
* setUiScale(s);
* setFontScale(s);
* };
* const handleLineHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
* const v = parseFloat(e.currentTarget.value);
* if (!Number.isFinite(v)) return;
* setUiLineHeight(v);
* applyToActive(l => ({ ...l, lineHeight: v }));
* };
* const handleOutlineWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
* const v = parseFloat(e.currentTarget.value);
* if (!Number.isFinite(v)) return;
* setUiOutlineWidth(v);
* applyToActive(l => ({ ...l, outlineEnabled: v > 0, outlineWidth: v }));
* };
* const setTextColor = (color: string) => {
* setUiTextColor(color);
* applyToActive(l => ({ ...(l as any), color }));
* };
* const setOutlineColor = (color: string) => {
* setUiOutlineColor(color);
* applyToActive(l => ({ ...(l as any), outlineEnabled: true, outlineColor: color }));
* };
* return (
  <>
  {/_ Obere Toolbar (immer sichtbar) _/}

-      <div
-        className="sticky top-0 z-50 w-full bg-transparent flex justify-center"
-      >

*      <div className="sticky top-0 z-50 w-full bg-transparent flex justify-center">
         {/* Die Toolbar-Box selbst: auto-breit, mittig */}
         <LegacyEditorToolbar
           onAddText={handleAddText}

-          className="py-1 px-2 inline-flex w-auto max-w-[calc(100vw-16px)] items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70"

*          className="py-1 px-2 inline-flex w-auto max-w-[calc(100vw-16px)] items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70"
         >

         {/* === BEGIN: LEGACY CONTROLS (NEU ANGERICHTET) === */}

         {/* --- ZEILE 1: Typo & Ausrichtung & Größe --- */}
         <div className="flex items-center gap-2">
           <button
             onClick={toggleBoldUI}
             aria-pressed={uiBold}
             className={
               "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium shadow-sm transition-colors " +
               (uiBold
                 ? "border-primary bg-primary text-primary-foreground"
                 : "border-border/80 bg-background/90 hover:bg-muted")
             }
             aria-label="Fett"
             title="Fett"
           >B</button>
           <button
             onClick={toggleItalicUI}
             aria-pressed={uiItalic}
             className={
               "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium shadow-sm transition-colors " +
               (uiItalic
                 ? "border-primary bg-primary text-primary-foreground"
                 : "border-border/80 bg-background/90 hover:bg-muted")
             }
               aria-label="Kursiv"
               title="Kursiv"
             >
               <span className="italic">I</span>
             </button>
         </div>

         {/* Ausrichtung */}
         <div className="flex items-center gap-2" aria-label="Textausrichtung">
           <button
             aria-pressed={uiAlign === "left"}
             className={
               "inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition-colors " +
               (uiAlign === "left"
                 ? "border-primary bg-primary text-primary-foreground"
                 : "border-border/80 bg-background/90 hover:bg-muted")
             }
             aria-label="Links ausrichten" title="Links ausrichten"
             onClick={() => setAlignUI("left")}
           >
             <AlignLeft className="h-4 w-4" />
           </button>
           <button
             aria-pressed={uiAlign === "center"}
             className={
               "inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition-colors " +
               (uiAlign === "center"
                 ? "border-primary bg-primary text-primary-foreground"
                 : "border-border/80 bg-background/90 hover:bg-muted")
             }
             aria-label="Zentrieren" title="Zentrieren"
             onClick={() => setAlignUI("center")}
           >
             <AlignCenter className="h-4 w-4" />
           </button>
           <button
             aria-pressed={uiAlign === "right"}
             className={
               "inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition-colors " +
               (uiAlign === "right"
                 ? "border-primary bg-primary text-primary-foreground"
                 : "border-border/80 bg-background/90 hover:bg-muted")
             }
             aria-label="Rechts ausrichten" title="Rechts ausrichten"
             onClick={() => setAlignUI("right")}
           >
             <AlignRight className="h-4 w-4" />
           </button>
         </div>

         {/* Größe × (Scale) */}
         <div className="flex items-center gap-2">
           <label className="text-xs text-muted-foreground">Größe ×</label>
           <input
             type="number"
             step="0.05"
             min="0.2"
             max="4"

-            onChange={(e) => setFontScale(parseFloat(e.currentTarget.value))}

*            value={uiScale}
*            onChange={(e) => handleScaleChange(parseFloat(e.currentTarget.value))}
             className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm"
           />
         </div>

         {/* Zeilenumbruch zu Zeile 2 */}
         <div className="basis-full h-0" />

         {/* --- ZEILE 2: Abstände & Farben --- */}
         {/* Zeilenhöhe (Input) */}
         <div className="flex items-center gap-2">
           <label className="text-xs text-muted-foreground">Zeilenhöhe</label>
           <input
             type="number"
             min="0.8"
             max="2"
             step="0.02"

-            onChange={handleLineHeightChange}

*            value={uiLineHeight}
*            onChange={handleLineHeightChange}
             className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm"
           />
         </div>

         {/* Kontur-Schalter */}
         <div className="flex items-center gap-2">
           <label className="text-xs text-muted-foreground">Kontur an</label>
           <input
             type="checkbox"
             checked={uiOutlineOn}
             onChange={handleToggleOutlineOn}
             className="h-4 w-4 accent-primary"
           />
         </div>

         {/* Konturbreite (Slider) */}
         <div className="flex items-center gap-2">
           <label className="text-xs text-muted-foreground">Konturbreite</label>
           <input
             type="range"
             min="0"
             max="12"
             step="0.5"

-            onChange={handleOutlineWidthChange}

*            value={uiOutlineWidth}
*            onChange={handleOutlineWidthChange}
             disabled={!uiOutlineOn}
             className="h-1.5 w-32 accent-primary disabled:opacity-40"
           />
         </div>

         {/* Textfarbe */}
         <div className="flex items-center gap-2">
           <label className="text-xs text-muted-foreground">Text</label>
           <input
             type="color"

-            onChange={(e) => setTextColor(e.currentTarget.value)}

*            value={uiTextColor}
*            onChange={(e) => setTextColor(e.currentTarget.value)}
             className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5"
           />
         </div>

         {/* Konturfarbe */}
         <div className="flex items-center gap-2">
           <label className="text-xs text-muted-foreground">Kontur</label>
           <input
             type="color"

-            onChange={(e) => setOutlineColor(e.currentTarget.value)}

*            value={uiOutlineColor}
*            onChange={(e) => setOutlineColor(e.currentTarget.value)}
               disabled={!uiOutlineOn}
               className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5 disabled:opacity-40"
             />
           </div>

           {/* === END: LEGACY CONTROLS === */}
           </LegacyEditorToolbar>
         </div>

  \*\*\* End Patch

Diff 2 — src/canvas/LegacyEditorToolbar.tsx
**_ Begin Patch
_** Update File: src/canvas/LegacyEditorToolbar.tsx
@@
return (

- <div
-      className={cn(
-        "mx-auto w-full max-w-[980px]",
-        // Der Wrapper erhält keine sticky, das macht weiterhin der umgebende Container (Legacy-Datei).
-        className,
-      )}
- >

* <div
*      className={cn(
*        // kompakt & mittig – keine unnötige Breite
*        "mx-auto w-auto",
*        className,
*      )}
* >
    <div
      className={cn(

-          "grid grid-cols-[auto,1fr] items-center gap-3 rounded-2xl border border-border/80",

*          // rechte Spalte nicht strecken: nur so breit wie Inhalt
*          "grid grid-cols-[auto,auto] items-center justify-center gap-3 rounded-2xl border border-border/80",
             "bg-background/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80",
           )}
         >
  @@

-        {/* Rechte Spalte: alle bisherigen Legacy-Controls (B, I, Ausrichtung, Slider, Farben, …) */}
-        <div className={cn("flex flex-wrap items-center gap-2")}>

*        {/* Rechte Spalte: Controls zentriert, keine Restbreite */}
*        <div className={cn("flex flex-wrap items-center justify-center gap-2")}>
             {children}
           </div>
         </div>
       </div>
  );
  \*\*\* End Patch
