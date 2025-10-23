Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

*** src/canvas/legacy/SlideCanvasLegacy.tsx
@@
-  const handleBackgroundPatch = useCallback(
-    (patch: Partial<SlideTextElement>) => {
-      if (!patch.background) return;
-      const nextBackground = {
-        ...patch.background,
-        paddingX: patch.background.paddingX ?? patch.background.paddingY ?? 12,
-        paddingY: patch.background.paddingY ?? patch.background.paddingX ?? 12,
-      };
-      applyToActive((l) => ({
-        ...l,
-        background: nextBackground,
-      }));
-    },
-    [applyToActive],
-  );
+  // Nimmt Patches aus der Toolbar entgegen und mapped sie auf das aktive Layer
+  const handleToolbarPatch = useCallback(
+    (patch: Partial<SlideTextElement>) => {
+      // 1) Hintergrund
+      if (patch.background) {
+        const nextBackground = {
+          ...patch.background,
+          paddingX:
+            patch.background.paddingX ?? patch.background.paddingY ?? 12,
+          paddingY:
+            patch.background.paddingY ?? patch.background.paddingX ?? 12,
+        };
+        applyToActive((l) => ({ ...l, background: nextBackground }));
+      }
+
+      // 2) Typografie / Layout
+      if (typeof patch.lineHeight === "number") {
+        applyToActive((l) => ({ ...l, lineHeight: patch.lineHeight! }));
+      }
+      if (typeof patch.letterSpacing === "number") {
+        applyToActive((l) => ({ ...l, letterSpacing: patch.letterSpacing! }));
+      }
+      if (patch.align) {
+        applyToActive((l) => ({ ...l, align: patch.align as any }));
+      }
+      // Toolbar liefert "fontSize" → wir mappen auf scale (BASE_FONT_PX * scale)
+      if (typeof patch.fontSize === "number" && Number.isFinite(patch.fontSize)) {
+        const nextScale = Math.max(0.2, Math.min(4, patch.fontSize / BASE_FONT_PX));
+        applyToActive((l) => ({ ...l, scale: nextScale }));
+      }
+
+      // Farben
+      if (typeof (patch as any).fill === "string") {
+        const c = (patch as any).fill as string;
+        applyToActive((l) => ({ ...l, color: c }));
+      }
+      if (typeof (patch as any).strokeWidth === "number") {
+        const w = (patch as any).strokeWidth as number;
+        applyToActive((l: any) => ({
+          ...l,
+          outlineEnabled: w > 0,
+          outlineWidth: w,
+        }));
+      }
+      if (typeof (patch as any).stroke === "string") {
+        const c = (patch as any).stroke as string;
+        applyToActive((l: any) => ({
+          ...l,
+          outlineEnabled: true,
+          outlineColor: c,
+        }));
+      }
+
+      // Bold / Italic (Toolbar nutzt fontWeight / fontStyle)
+      if (typeof (patch as any).fontWeight === "string") {
+        const isBold = ((patch as any).fontWeight as string) === "bold";
+        applyToActive((l) => ({ ...l, weight: isBold ? "bold" : "regular" }));
+      }
+      if (typeof (patch as any).fontStyle === "string") {
+        const isItalic = ((patch as any).fontStyle as string) === "italic";
+        applyToActive((l: any) => ({ ...l, italic: isItalic }));
+      }
+    },
+    [applyToActive],
+  );
@@
-        <LegacyEditorToolbar
-          onAddText={handleAddText}
-          className="py-1 px-2"
-          selectedText={
-            active
-              ? ({
-                  id: active.id,
-                  background: active.background,
-                } as SlideTextElement)
-              : null
-          }
-          onChangeSelectedText={handleBackgroundPatch}
-        >
+        <LegacyEditorToolbar
+          onAddText={handleAddText}
+          className="py-1 px-2"
+          selectedText={
+            active
+              ? ({
+                  id: active.id,
+                  // Werte so liefern, wie die Toolbar sie erwartet:
+                  // fontSize = BASE_FONT_PX * scale
+                  fontSize: Math.round(BASE_FONT_PX * (Number.isFinite(active.scale) ? active.scale : 1)),
+                  lineHeight: active.lineHeight,
+                  letterSpacing: active.letterSpacing,
+                  align: active.align,
+                  // Farbe(n)
+                  // Toolbar liest 'fill' für Textfarbe
+                  fill: (active as any).color ?? "#ffffff",
+                  // Toolbar liest 'stroke' + 'strokeWidth' für Kontur
+                  stroke: (active as any).outlineColor ?? "#000000",
+                  strokeWidth: (active as any).outlineWidth ?? 0,
+                  // Bold / Italic
+                  fontWeight: active.weight === "bold" ? ("bold" as any) : ("normal" as any),
+                  fontStyle: (active as any).italic ? ("italic" as any) : ("normal" as any),
+                  // Hintergrund
+                  background: active.background,
+                } as unknown as SlideTextElement)
+              : null
+          }
+          onChangeSelectedText={handleToolbarPatch}
+        >