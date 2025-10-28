Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

1. Outline-Button/-Farbe tut nichts → Mapping robust machen

Datei: src/canvas/SlideCanvasAdapter.tsx
Änderung: Mapping aus der Toolbar-Payload erweitert (unterstützt jetzt auch outlineColor/outlineWidth) und typo-freie Spreads, damit Klicks auf den Kontur-Button und Farb-Picker sofort wirken.

\*\*\* a/src/canvas/SlideCanvasAdapter.tsx
--- b/src/canvas/SlideCanvasAdapter.tsx
@@
const handleToolbarPatch = useCallback(
(patch: Partial<SlideTextElement>) => {
@@

-      if (patch.align) {
-        applyToActive((l) => ({ .l, align: patch.align as any }));
-      }

*      if (patch.align) {
*        applyToActive((l) => ({ ...l, align: patch.align as any }));
*      }
  @@

-        applyToActive((l) => ({ .l, scale: nextScale }));

*        applyToActive((l) => ({ ...l, scale: nextScale }));
       }

       // Farben
       if (typeof (patch as any).fill === "string") {
         const c = (patch as any).fill as string;

-        applyToActive((l) => ({ .l, color: c }));

*        applyToActive((l) => ({ ...l, color: c }));
       }
       if (typeof (patch as any).strokeWidth === "number") {
         const w = (patch as any).strokeWidth as number;
         applyToActive((l: any) => ({

-          .l,

*          ...l,
           outlineEnabled: w > 0,
           outlineWidth: w,
         }));
       }
       if (typeof (patch as any).stroke === "string") {
         const c = (patch as any).stroke as string;
         applyToActive((l: any) => ({

-          .l,

*          ...l,
           outlineEnabled: true,
           outlineColor: c,
           outlineWidth:

-            l.

*            l.outlineWidth && l.outlineWidth > 0
*              ? l.outlineWidth
*              : TIKTOK_OUTLINE_WIDTH,
         }));
       }
*      // Explizite Keys direkt unterstützen (falls die Toolbar sie sendet)
*      if (typeof (patch as any).outlineWidth === "number") {
*        const w = (patch as any).outlineWidth as number;
*        applyToActive((l: any) => ({
*          ...l,
*          outlineEnabled: w > 0,
*          outlineWidth: w,
*        }));
*      }
*      if (typeof (patch as any).outlineColor === "string") {
*        const c = (patch as any).outlineColor as string;
*        applyToActive((l: any) => ({
*          ...l,
*          outlineEnabled: true,
*          outlineColor: c,
*          outlineWidth:
*            l.outlineWidth && l.outlineWidth > 0
*              ? l.outlineWidth
*              : TIKTOK_OUTLINE_WIDTH,
*        }));
*      }
  @@

-      if (typeof (patch as any).fontStyle === "string") {
-        const isItalic = ((patch as any).fontStyle as string) === "italic";
-        applyToActive((l: any) => ({ .l, italic: isItalic }));
-      }

*      if (typeof (patch as any).fontStyle === "string") {
*        const isItalic = ((patch as any).fontStyle as string) === "italic";
*        applyToActive((l: any) => ({ ...l, italic: isItalic }));
*      }
  },
  [applyToActive],
  );

Verweise im Code: Toolbar sendet stroke/outlineColor/… (siehe Toolbar-Colorpicker und Toggle), Preview & Export lesen outlineEnabled/outlineWidth/outlineColor und reagieren sofort (Text-Shadow/Canvas-Stroke).

codebase

codebase

codebase

codebase

codebase

2. Mehrere generierte Textboxen überlappen → Mindestabstand automatisch erzwingen

Datei: src/canvas/legacy/SlideCanvasLegacy.tsx
Änderung: Ein kleiner, deterministischer Layout-Pass nach Änderungen an textLayers, der die Boxen nach y sortiert und nach unten schiebt, wenn sie sich schneiden. Nutzt vorhandene height (Auto-Height ist bereits implementiert).

_\*\* a/src/canvas/legacy/SlideCanvasLegacy.tsx
--- b/src/canvas/legacy/SlideCanvasLegacy.tsx
@@
const BASE_FONT_PX = 72;
// Zusätzlicher Puffer für Descender (z. B. g, y, p, q, j), damit beim Export nichts abgeschnitten wird
const DESCENT_PAD = Math.ceil(BASE_FONT_PX _ 0.25); // ~25 % der Basis-Fonthöhe
+// Mindestabstand zwischen Textboxen (skaliert leicht mit Basisgröße)
+const MIN_TEXT_GAP = Math.max(8, Math.round(BASE_FONT_PX \* 0.18));
@@
const [dimBg, setDimBg] = React.useState(false);
@@
const applyToActive = (updater: (l: TextLayer) => TextLayer) => {
const id = getActiveId();
if (!id) return;
setTextLayers((prev) => prev.map((l) => (l.id === id ? updater(l) : l)));
};

-
- /\*\*
- - Verhindert Überlappungen vertikal benachbarter Text-Layer.
- - Annahmen:
- - - Rotation ~ 0 (gilt bei uns)
- - - width/height sind gesetzt (Auto-Height ist bereits berechnet)
- \*/
- const enforceMinVerticalSpacing = useCallback((layers: TextLayer[]) => {
- const next = [...layers].sort((a, b) => a.y - b.y);
- for (let i = 1; i < next.length; i++) {
-      const prev = next[i - 1];
-      const cur = next[i];
-      // Nur Text-Layer betrachten
-      // (bei dir sind es hier ohnehin Text-Layer in diesem Array)
-      const prevTop = prev.y - (prev.height ?? 0) / 2;
-      const prevBottom = prev.y + (prev.height ?? 0) / 2;
-      const curTop = cur.y - (cur.height ?? 0) / 2;
-      const neededTop = prevBottom + MIN_TEXT_GAP;
-      if (curTop < neededTop) {
-        const curHalf = (cur.height ?? 0) / 2;
-        const newY = neededTop + curHalf;
-        cur.y = Math.round(newY);
-      }
- }
- // ursprüngliche Reihenfolge zurückgeben, aber mit aktualisierten y
- const map = new Map(next.map((l) => [l.id, l.y]));
- return layers.map((l) => (map.has(l.id) ? { ...l, y: map.get(l.id)! } : l));
- }, []);
-
- // Wenn Text-Layer entstehen/ändern (z. B. 4 Prompts → 4 Boxen),
- // gleiche automatisch vertikal auf Abstand aus.
- useEffect(() => {
- setTextLayers((prev) => {
-      if (!prev || prev.length <= 1) return prev;
-      return enforceMinVerticalSpacing(prev);
- });
- }, [enforceMinVerticalSpacing, /* Trigger bei Layout-Änderungen: */ textLayers.length]);
  @@
  const setTextColor = (color: string) => {
  applyToActive((l) => ({ ...l, color }));
  };
  const setOutlineColor = (color: string) => {
  applyToActive((l) => ({ ...l, outlineEnabled: true, outlineColor: color }));
  };
