Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@

- setTextLayers((prev) => {

* setTextLayers(((prev) => {
  // ... bestehende Logik bleibt unverändert ...

- });

* }) as (
*      prevState: (TextLayer & {
*        autoHeight?: boolean;
*        italic?: boolean;
*        outlineEnabled?: boolean;
*        outlineWidth?: number;
*        outlineColor?: string;
*      })[]
* ) => (
*      TextLayer & {
*        autoHeight?: boolean;
*        italic?: boolean;
*        outlineEnabled?: boolean;
*        outlineWidth?: number;
*        outlineColor?: string;
*      }
* )[]);
  @@

-            type BgPatch = {

*            type BgPatch = {
               opacity?: number;
               paddingX?: number;
               paddingY?: number;

-              mode?: unknown;

*              mode?: 'block' | 'blob';
                 color?: string;
                 radius?: number;
                 lineOverlap?: number;
               };
               const prevBg = (prev.background ?? {}) as Partial<BgPatch>;
  @@

-              patch.background?.mode ?? prevBg.mode ?? TIKTOK_BACKGROUND_MODE,

*              (patch.background?.mode ?? prevBg.mode ?? TIKTOK_BACKGROUND_MODE) as 'block' | 'blob',
  \*\*\* End Patch
