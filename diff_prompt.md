Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ a/src/canvas/legacy/SlideCanvasLegacy.tsx
--- b/src/canvas/legacy/SlideCanvasLegacy.tsx
@@
// Mindestabstand zwischen Textboxen (skaliert leicht mit Basisgröße)
-const MIN_TEXT_GAP = Math.max(1, Math.round(BASE_FONT_PX _ 0.03));
+// halbierter Gap, damit die Boxen dichter beieinander liegen (User-Wunsch)
+const MIN*TEXT_GAP = Math.max(1, Math.round(BASE_FONT_PX * 0.015));
diff
Code kopieren
\_** a/src/canvas/LegacyEditorToolbar.tsx
--- b/src/canvas/LegacyEditorToolbar.tsx
@@

-              onChangeSelectedText?.({
-                .selectedText!,

*              onChangeSelectedText?.({
*                ...selectedText!,
                   strokeEnabled: true,
                   outlineEnabled: true,
                   strokeWidth: TIKTOK_OUTLINE_WIDTH,
                   outlineWidth: TIKTOK_OUTLINE_WIDTH,
                   stroke: currentColor,
                   outlineColor: currentColor,
                 });
  @@

-              if (bgEnabled) {

*              if (bgEnabled) {
                 setTextBgOpacity(0);

-                onChangeSelectedText?.({
-                  ...selectedText!,

*                onChangeSelectedText?.({
*                  ...selectedText!,
                     background: {
                       ...(selectedBackground ?? {}),
                       opacity: 0,
                       enabled: false,
                       paddingX: TIKTOK_BACKGROUND_PADDING,
  @@
  const nextBackground = {
  enabled: true,
  mode: TIKTOK_BACKGROUND_MODE,
  color: nextColor,
  opacity: TIKTOK_BACKGROUND_OPACITY,
  paddingX: TIKTOK_BACKGROUND_PADDING,
  paddingY: TIKTOK_BACKGROUND_PADDING,
  radius: TIKTOK_BACKGROUND_RADIUS,
  lineOverlap: selectedBackground?.lineOverlap ?? 0,
  } as SlideTextElement["background"];

-              onChangeSelectedText?.({
-                .selectedText!,

*              onChangeSelectedText?.({
*                ...selectedText!,
                   background: nextBackground,
                 });
  diff
  Code kopieren
  \*\*\* a/src/canvas/SlideCanvasAdapter.tsx
  --- b/src/canvas/SlideCanvasAdapter.tsx
  @@
  import type { SlideTextElement } from "@/lib/types";
  +import {
* TIKTOK_OUTLINE_COLOR,
* TIKTOK_OUTLINE_WIDTH,
  +} from "@/canvas/tiktokDefaults";
  @@
  const handleToolbarPatch = useCallback(
  (patch: Partial<SlideTextElement>) => {
  // 1) Hintergrund
  if (patch.background) {
  applyToActive((l) => {
  @@
  return { ...l, background: nextBackground };
  });
  }
  // 2) Typografie / Layout
  if (typeof patch.lineHeight === "number") {

-        applyToActive((l) => ({ ...l, lineHeight: patch.lineHeight! }));

*        applyToActive((l) => ({ ...l, lineHeight: patch.lineHeight! }));
       }
       if (typeof patch.letterSpacing === "number") {

-        applyToActive((l) => ({ ...l, letterSpacing: patch.letterSpacing! }));

*        applyToActive((l) => ({ ...l, letterSpacing: patch.letterSpacing! }));
       }

-      if (patch.align) {
-        applyToActive((l) => ({ .l, align: patch.align as any }));
-      }

*      if (patch.align) {
*        applyToActive((l) => ({ ...l, align: patch.align as any }));
*      }
       // Toolbar liefert "fontSize" → mappen auf scale (BASE_FONT_PX * scale)
       if (
         typeof (patch as any).fontSize === "number" &&
         Number.isFinite((patch as any).fontSize)
       ) {
         const nextScale = Math.max(
           0.2,
           Math.min(4, (patch as any).fontSize / BASE_FONT_PX),
         );

-        applyToActive((l) => ({ .l, scale: nextScale }));

*        applyToActive((l) => ({ ...l, scale: nextScale }));
       }

       // Farben
       if (typeof (patch as any).fill === "string") {
         const c = (patch as any).fill as string;

-        applyToActive((l) => ({ .l, color: c }));

*        applyToActive((l) => ({ ...l, color: c }));
       }

       // === Outline/Stroke Mapping robust machen ===

*      // width-Änderung
       if (typeof (patch as any).strokeWidth === "number") {
         const w = (patch as any).strokeWidth as number;

-        applyToActive((l: any) => ({
-          .l,
-          outlineEnabled: w > 0,
-          outlineWidth: w,
-        }));

*        applyToActive((l: any) => ({
*          ...l,
*          outlineEnabled: w > 0,
*          outlineWidth: w,
*        }));
       }
*      // explizite outlineWidth
*      if (typeof (patch as any).outlineWidth === "number") {
*        const w = (patch as any).outlineWidth as number;
*        applyToActive((l: any) => ({
*          ...l,
*          outlineEnabled: w > 0,
*          outlineWidth: w,
*        }));
*      }
*      // Farbänderung
       if (typeof (patch as any).stroke === "string") {
         const c = (patch as any).stroke as string;

-        applyToActive((l: any) => ({
-          .l,
-          outlineEnabled: true,
-          outlineColor: c,
-          outlineWidth:
-            l.outlineWidth && l.outlineWidth > 0
-              ? l.outlineWidth
-              : TIKTOK_OUTLINE_WIDTH,
-        }));

*        applyToActive((l: any) => ({
*          ...l,
*          outlineEnabled: true,
*          outlineColor: c,
*          outlineWidth:
*            l.outlineWidth && l.outlineWidth > 0
*              ? l.outlineWidth
*              : TIKTOK_OUTLINE_WIDTH,
*        }));
       }
*      // explizite outlineColor
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
*      // explizite Toggles (kommen vom Toolbar-Button)
*      if (typeof (patch as any).outlineEnabled === "boolean") {
*        const en = (patch as any).outlineEnabled as boolean;
*        applyToActive((l: any) => ({
*          ...l,
*          outlineEnabled: en,
*          outlineWidth: en
*            ? l.outlineWidth && l.outlineWidth > 0
*              ? l.outlineWidth
*              : TIKTOK_OUTLINE_WIDTH
*            : 0,
*          outlineColor: l.outlineColor ?? TIKTOK_OUTLINE_COLOR,
*        }));
*      }
*      if (typeof (patch as any).strokeEnabled === "boolean") {
*        const en = (patch as any).strokeEnabled as boolean;
*        applyToActive((l: any) => ({
*          ...l,
*          outlineEnabled: en,
*          outlineWidth: en
*            ? l.outlineWidth && l.outlineWidth > 0
*              ? l.outlineWidth
*              : TIKTOK_OUTLINE_WIDTH
*            : 0,
*          outlineColor: l.outlineColor ?? TIKTOK_OUTLINE_COLOR,
*        }));
*      }

       if (typeof (patch as any).fontStyle === "string") {
         const isItalic = ((patch as any).fontStyle as string) === "italic";

-        applyToActive((l: any) => ({ .l, italic: isItalic }));

*        applyToActive((l: any) => ({ ...l, italic: isItalic }));
       }
  },
  [applyToActive],
  );
