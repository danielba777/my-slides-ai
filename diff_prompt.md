Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

*** Begin Patch
*** Add File: src/components/presentation/presentation-page/StickyDownloadActions.tsx
+"use client";
+
+import React from "react";
+import { DownloadSlidesButton } from "./buttons/DownloadSlidesButton";
+
+/**
+ * Fixierter Aktionsbereich oben rechts im Viewport,
+ * damit der Download-Button immer erreichbar bleibt – auch bei horizontalem Scrollen.
+ */
+export default function StickyDownloadActions() {
+  return (
+    <div
+      className="
+        fixed top-4 right-4 z-50
+        flex items-center gap-2
+      "
+    >
+      <DownloadSlidesButton />
+    </div>
+  );
+}
+
*** End Patch
diff
Code kopieren
*** Begin Patch
*** Update File: src/components/presentation/presentation-page/PresentationSlidesView.tsx
@@
-import React, { memo, useEffect, useRef } from "react";
+import React, { memo, useEffect, useRef } from "react";
@@
 import { SortableSlide } from "./SortableSlide";
 const SlideCanvas = dynamic(() => import("@/canvas/SlideCanvasAdapter"), {
   ssr: false,
 });
 import type { SlideCanvasAdapterHandle } from "@/canvas/SlideCanvasAdapter";
+import StickyDownloadActions from "./StickyDownloadActions";
 
@@
 export default function PresentationSlidesView() {
   const isPresenting = useIsPresenting();
   const slides = usePresentationState((s) => s.slides);
@@
   return (
     <div className="w-full h-full overflow-hidden flex flex-col">
+      {/* Fixierter Download-Button oben rechts – nur im Edit-Modus */}
+      {!isPresenting && <StickyDownloadActions />}
       <div className="flex-1 overflow-auto">
         <div className="flex items-start gap-6 px-6 py-4">
           {slides.map((slide, index) => (
             <SlideFrame
               key={slide.id}
*** End Patch