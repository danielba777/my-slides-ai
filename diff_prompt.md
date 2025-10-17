Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

Diff #1 – BG-Image-Update: nie wieder Text verlieren

File: src/components/presentation/utils/canvas.ts

*** a/src/components/presentation/utils/canvas.ts
--- b/src/components/presentation/utils/canvas.ts
@@
-export function applyBackgroundImageToCanvas(
-  canvas: CanvasDoc | null | undefined,
-  imageUrl?: string | null,
-): CanvasDoc {
-  const base: CanvasDoc = {
-    width: canvas?.width ?? DEFAULT_CANVAS.width,
-    height: canvas?.height ?? DEFAULT_CANVAS.height,
-    bg: canvas?.bg ?? DEFAULT_CANVAS.bg,
-    nodes: canvas?.nodes ? [...canvas.nodes] : [],
-    selection: canvas?.selection ?? [],
-  };
+export function applyBackgroundImageToCanvas(
+  canvas: CanvasDoc | null | undefined,
+  imageUrl?: string | null,
+): CanvasDoc {
+  // Starte IMMER vom bestehenden Canvas und erhalte ALLE Nicht-Image-Nodes
+  const base: CanvasDoc = {
+    width: canvas?.width ?? DEFAULT_CANVAS.width,
+    height: canvas?.height ?? DEFAULT_CANVAS.height,
+    bg: canvas?.bg ?? DEFAULT_CANVAS.bg,
+    nodes: Array.isArray(canvas?.nodes) ? [...canvas!.nodes] : [],
+    selection: Array.isArray(canvas?.selection) ? [...(canvas!.selection as any[])] : [],
+  };
 
   if (!imageUrl) {
     return base;
   }
 
-  const imageNode = {
+  const imageNode = {
     id: "canvas-background-image",
     type: "image" as const,
     x: 0,
     y: 0,
     width: base.width,
     height: base.height,
     url: imageUrl,
   };
 
-  const existingIndex = base.nodes.findIndex((node) => node.type === "image");
-  if (existingIndex >= 0) {
-    const existing = base.nodes[existingIndex] as any;
-    const sameUrl =
-      typeof existing?.url === "string" &&
-      typeof imageNode.url === "string" &&
-      existing.url === imageNode.url;
-    const sameSize =
-      existing?.width === imageNode.width && existing?.height === imageNode.height;
-    if (sameUrl && sameSize) {
-      return base;
-    }
-    base.nodes[existingIndex] = imageNode;
-  } else {
-    base.nodes.unshift(imageNode);
-  }
+  // Entferne ausschließlich den bisherigen BG-Image-Knoten (falls vorhanden),
+  // erhalte aber ALLE anderen Nodes (v. a. Text!)
+  const withoutBg = base.nodes.filter((n: any) => !(n?.type === "image" && n?.id === "canvas-background-image"));
+
+  // Prüfe Idempotenz: existiert bereits der gleiche BG?
+  const prevBg = base.nodes.find((n: any) => n?.type === "image" && n?.id === "canvas-background-image") as any;
+  if (prevBg) {
+    const sameUrl = prevBg.url === imageNode.url;
+    const sameSize = prevBg.width === imageNode.width && prevBg.height === imageNode.height;
+    if (sameUrl && sameSize) {
+      // nichts ändern
+      return { ...base, nodes: base.nodes };
+    }
+  }
+
+  // BG-Image immer als unterstes Element einfügen
+  const mergedNodes = [imageNode, ...withoutBg];
+  return { ...base, nodes: mergedNodes };
 }


Was das verhindert: Egal wann applyBackgroundImageToCanvas aufgerufen wird – Textknoten bleiben immer erhalten, der BG-Node wird nur ge-upsertet und nie „mitgerissen“.

Diff #2 – Safe-Merge beim Setzen des Canvas aus dem Editor

File: src/components/presentation/presentation-page/PresentationSlidesView.tsx
(dort, wo du dem SlideCanvas ein onChange gibst)

*** a/src/components/presentation/presentation-page/PresentationSlidesView.tsx
--- b/src/components/presentation/presentation-page/PresentationSlidesView.tsx
@@
-              <SlideCanvas
-                doc={safeCanvas}
-                onChange={(next: CanvasDoc) => {
-                  const { slides, setSlides } = usePresentationState.getState();
-                  const updated = slides.slice();
-                  const indexToUpdate = updated.findIndex((x) => x.id === slide.id);
-                  if (indexToUpdate < 0) return;
-                  const current = updated[indexToUpdate];
-                  if (!current) return;
-                  if (current.canvas !== next) {
-                    updated[indexToUpdate] = { ...current, canvas: next };
-                    setSlides(updated);
-                  }
-                }}
-              />
+              <SlideCanvas
+                doc={safeCanvas}
+                onChange={(next: CanvasDoc) => {
+                  const { slides, setSlides } = usePresentationState.getState();
+                  const updated = slides.slice();
+                  const i = updated.findIndex((x) => x.id === slide.id);
+                  if (i < 0) return;
+                  const current = updated[i];
+                  if (!current) return;
+
+                  const currCanvas = current.canvas as CanvasDoc | undefined;
+
+                  // 🛡️ SAFETY MERGE: verliere nie Textknoten beim Update
+                  const currTextNodes = Array.isArray(currCanvas?.nodes)
+                    ? (currCanvas!.nodes.filter((n: any) => n?.type === "text"))
+                    : [];
+                  const nextTextNodes = Array.isArray(next?.nodes)
+                    ? (next!.nodes.filter((n: any) => n?.type === "text"))
+                    : [];
+
+                  let merged: CanvasDoc = next;
+                  if (currTextNodes.length > 0 && nextTextNodes.length === 0) {
+                    // Race: next hat (noch) keine Texte → Texte aus current konservieren
+                    const otherNodes = Array.isArray(next?.nodes) ? next.nodes.filter((n: any) => n?.type !== "text") : [];
+                    merged = { ...next, nodes: [...otherNodes, ...currTextNodes] };
+                  }
+
+                  // Nur setzen, wenn sich tatsächlich was geändert hat
+                  if (currCanvas !== merged) {
+                    updated[i] = { ...current, canvas: merged };
+                    setSlides(updated);
+                  }
+                }}
+              />


Was das verhindert: Selbst wenn irgendwo im System noch ein Update ohne Textknoten reinkommt (z. B. durch späten BG-Reflow/Resize), bewahren wir vorhandene Textknoten und verlieren sie nicht mehr.

Diff #3 – Stabilität beim Drag & Render

File: src/components/presentation/canvas/SlideCanvasBase.tsx

Du hast hier schon vieles richtig. Zwei kleine Ergänzungen, die Remounts vermeiden und während „stillen“ Updates das UI stabil halten.

*** a/src/components/presentation/canvas/SlideCanvasBase.tsx
--- b/src/components/presentation/canvas/SlideCanvasBase.tsx
@@
-            <Text
-              key={`text-${activeTextNode?.id ?? "fallback"}`}
+            <Text
+              // Stabiler Key pro Slide, nicht pro Node-Wechsel → kein Remount beim Umschalten/Autosave
+              key={`text-slide-${slide.id}`}
               text={textContent}
               fontSize={32}
               fontFamily="TikTok Sans, sans-serif"
               fill="#ffffff"
               x={textPosition.x}
               y={textPosition.y}
               draggable={!disableDrag}
               onDragStart={handleDragStart}
               onDragMove={handleDragMove}
               onDragEnd={handleDragEnd}
+              visible={true}
+              opacity={1}
+              listening={true}
               dragBoundFunc={(pos) => ({
                 x: Math.min(
                   Math.max(0, pos.x),
                   stageDimensions.width - 10
                 ),
                 y: Math.min(
                   Math.max(0, pos.y),
                   stageDimensions.height - 10
                 ),
               })}
             />


Und zusätzlich ein Mini-Guard gegen „Positions-Resets“ genau während stiller BG-Updates:

*** a/src/components/presentation/canvas/SlideCanvasBase.tsx
--- b/src/components/presentation/canvas/SlideCanvasBase.tsx
@@
-  useEffect(() => {
-    if (isDraggingTextRef.current) return;
-    const next = slideWithExtras.position ?? defaultPosition;
-    if (next.x !== textPosition.x || next.y !== textPosition.y) {
-      setTextPosition(next);
-    }
-  }, [
-    slideWithExtras.position?.x,
-    slideWithExtras.position?.y,
-    defaultPosition,
-    textPosition.x,
-    textPosition.y,
-  ]);
+  useEffect(() => {
+    if (isDraggingTextRef.current) return;
+    const next = slideWithExtras.position ?? defaultPosition;
+    // Blockiere micro-jitters (±0.5px) durch Scale/Resize-Runden
+    const dx = Math.abs((next.x ?? 0) - (textPosition.x ?? 0));
+    const dy = Math.abs((next.y ?? 0) - (textPosition.y ?? 0));
+    if (dx > 0.5 || dy > 0.5) {
+      setTextPosition(next);
+    }
+  }, [
+    slideWithExtras.position?.x,
+    slideWithExtras.position?.y,
+    defaultPosition,
+    textPosition.x,
+    textPosition.y,
+  ]);