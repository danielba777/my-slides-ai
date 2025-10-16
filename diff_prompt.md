Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

\*\*\* a/src/canvas/legacy/SlideCanvasLegacy.tsx
--- b/src/canvas/legacy/SlideCanvasLegacy.tsx
@@
const setTextColor = (color: string) => {
applyToActive(l => ({ ...l, color }));
};
const setOutlineColor = (color: string) => {
applyToActive(l => ({ ...l, outlineEnabled: true, outlineColor: color }));
};
@@

- const [uiTextColor, setUiTextColor] = useState<string>("#ffffff");
- const [uiOutlineColor, setUiOutlineColor] = useState<string>("#000000");

* const [uiTextColor, setUiTextColor] = useState<string>("#ffffff");
* const [uiOutlineColor, setUiOutlineColor] = useState<string>("#000000");
  @@

- const setTextColor = (color: string) => {
- setUiTextColor(color);
- applyToActive(l => ({ ...(l as any), color }));
- };
- const setOutlineColor = (color: string) => {
- setUiOutlineColor(color);
- applyToActive(l => ({ ...(l as any), outlineEnabled: true, outlineColor: color }));
- };

* // UI-Handler klar benennen, um Namenskollisionen mit den Canvas-Actions zu vermeiden
* const setTextColorUI = (color: string) => {
* setUiTextColor(color);
* applyToActive(l => ({ ...(l as any), color }));
* };
* const setOutlineColorUI = (color: string) => {
* setUiOutlineColor(color);
* applyToActive(l => ({ ...(l as any), outlineEnabled: true, outlineColor: color }));
* };
  @@

-      <div
-        className="sticky top-0 z-50 w-full bg-transparent flex justify-center"
-      >

*      <div
*        className="sticky top-0 z-50 w-full bg-transparent flex justify-center"
*      >
         {/* Die Toolbar-Box selbst: auto-breit, mittig */}
         <LegacyEditorToolbar
           onAddText={handleAddText}

-          className="py-1 px-2 inline-flex w-auto max-w-[calc(100vw-16px)] items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70"

*          className="py-1 px-2 inline-flex w-fit max-w-full items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70 flex-wrap mx-auto"
           >
  @@

-          <input

*          <input
             type="color"
             value={uiTextColor}

-            onChange={(e) => setTextColor(e.currentTarget.value)}

*            onChange={(e) => setTextColorUI(e.currentTarget.value)}
               className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5"
             />
  @@

-          <input

*          <input
             type="color"
             value={uiOutlineColor}

-            onChange={(e) => setOutlineColor(e.currentTarget.value)}

*            onChange={(e) => setOutlineColorUI(e.currentTarget.value)}
             disabled={!uiOutlineOn}
             className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5 disabled:opacity-40"
           />
