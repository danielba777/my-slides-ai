Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/app/admin/slideshow-library/accounts/[id]/edit/page.tsx
@@

- uploadData.append("profileImage", file);

* if (file) {
*      uploadData.append("profileImage", file);
* }
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/app/admin/slideshow-library/accounts/new/page.tsx
  @@

- uploadData.append("profileImage", file);

* if (file) {
*      uploadData.append("profileImage", file);
* }
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/app/admin/slideshow-library/posts/new/page.tsx
  @@

-          publishedAt: new Date(formData.publishedAt),
-          createdAt: new Date(formData.createdAt),

*          publishedAt: formData.publishedAt ? new Date(formData.publishedAt) : undefined,
*          createdAt: formData.createdAt ? new Date(formData.createdAt) : undefined,
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
  @@

-      // Toolbar liefert "fontSize" → wir mappen auf scale (BASE_FONT_PX * scale)
-      if (typeof patch.fontSize === "number" && Number.isFinite(patch.fontSize)) {
-        const nextScale = Math.max(0.2, Math.min(4, patch.fontSize / BASE_FONT_PX));

*      // Toolbar liefert "fontSize" → mappen auf scale (BASE_FONT_PX * scale)
*      if (typeof (patch as any).fontSize === "number" && Number.isFinite((patch as any).fontSize)) {
*        const nextScale = Math.max(0.2, Math.min(4, (patch as any).fontSize / BASE_FONT_PX));
           applyToActive((l) => ({ ...l, scale: nextScale }));
         }
  \*\*\* End Patch
  Die Stelle ist bereits sehr ähnlich bei dir; hier die minimal nötige Umstellung auf as any, damit fontSize (nicht Teil von SlideTextElement) akzeptiert wird.
  codebase

diff
Code kopieren
**_ Begin Patch
_** Update File: src/canvas/LegacyEditorToolbar.tsx
@@
type LegacyEditorToolbarProps = {
@@

- onChangeSelectedText?: (patch: Partial<SlideTextElement>) => void;

* // Patch kommt teils mit Zusatzfeldern aus der Toolbar (fill, stroke, fontWeight etc.)
* onChangeSelectedText?: (patch: Partial<SlideTextElement> & Record<string, unknown>) => void;
  };
  \*\*\* End Patch
  Damit verschwinden die Fehler zu fontWeight, fontStyle, fill, strokeWidth, stroke beim Aufruf. Siehe die Aufrufe innerhalb der Toolbar, z.B. Farbe/Kontur u.ä.
  codebase

codebase

diff
Code kopieren
**_ Begin Patch
_** Update File: src/components/plate/ui/import-toolbar-button.tsx
@@

- const { openFilePicker: openMdFilePicker } = useFilePicker({

* const { openFilePicker: openMdFilePicker } = useFilePicker({
  accept: [".md", ".mdx"],
  multiple: false,

- onFilesSelected: async ({ plainFiles }) => {
-      const text = await plainFiles[0].text();

* onFilesSelected: async (data) => {
*      const { plainFiles } = data as any;
*      const text = await (plainFiles?.[0]?.text?.() ?? Promise.resolve(""));
  @@

- const { openFilePicker: openHtmlFilePicker } = useFilePicker({

* const { openFilePicker: openHtmlFilePicker } = useFilePicker({
  accept: ["text/html"],
  multiple: false,

- onFilesSelected: async ({ plainFiles }) => {
-      const text = await plainFiles[0].text();

* onFilesSelected: async (data) => {
*      const { plainFiles } = data as any;
*      const text = await (plainFiles?.[0]?.text?.() ?? Promise.resolve(""));
  \*\*\* End Patch
  Die Komponente nutzt use-file-picker; dessen Callback-Typ erwartet ein Sammelobjekt statt destrukturiertem Param. Minimal gelöst durch neutrales data + Cast.
  codebase

diff
Code kopieren
**_ Begin Patch
_** Update File: src/components/plate/ui/media-placeholder-node.tsx
@@

-      onFilesSelected: ({ plainFiles: updatedFiles }) => {

*      onFilesSelected: (data) => {
*        const { plainFiles: updatedFiles } = data as any;
           // ...
         }
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/components/plate/ui/media-toolbar-button.tsx
  @@

- onFilesSelected: ({ plainFiles: updatedFiles }) => {

* onFilesSelected: (data) => {
*      const { plainFiles: updatedFiles } = data as any;
         // ...
       }
  \*\*\* End Patch
  Die beiden haben denselben Mismatch wie oben. (Gleiches Muster anwenden.)
  codebase

diff
Code kopieren
**_ Begin Patch
_** Update File: src/components/presentation/dashboard/ImageCollectionSelector.tsx
@@
-import { useCallback, useEffect, useMemo, useState } from "react";
+import { useCallback, useEffect, useMemo, useState } from "react";
+import type { JSX } from "react";
\*\*\* End Patch
