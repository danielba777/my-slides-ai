Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

*** Begin Patch
*** Update File: src/components/presentation/presentation-page/SlideContainer.tsx
@@
   const handleConfirm = (imageUrl: string) => {
     const updated = slides.slice();
     if (!updated[index]) return;

     // ➕ Persönliches Bild als Overlay-Node (unter dem Text, über dem BG)
     const slide = updated[index]!;
     const canvas = ensureCanvas(slide.canvas as CanvasDoc | undefined);

     // Entferne evtl. vorhandenes persönliches Bild (1 pro Slide)
     const nodesWithoutOld = canvas.nodes.filter(
       (n: any) => !(n?.type === "image" && n?.id === "user-overlay-image"),
     );

     // Vollflächig initialisieren (Cover/Contain handled der Legacy-Canvas bereits visuell)
     const personalNode = {
       id: "user-overlay-image",
       type: "image" as const,
       x: 0,
       y: 0,
       width: canvas.width,
       height: canvas.height,
       url: imageUrl,
     };

     const nextCanvas: CanvasDoc = {
       ...canvas,
       nodes: [...nodesWithoutOld, personalNode],
       // direkt vorselektieren, damit Drag/Zoom sofort funktioniert
       selection: ["user-overlay-image"],
     };

     updated[index] = { ...slide, canvas: nextCanvas };
     setSlides(updated);
-
-    // Direkt in den Overlay-Editmodus wechseln
-    setEditingOverlaySlideId(slide.id);
     setOpen(false);
   };
*** End Patch

*** Update File: src/components/presentation/presentation-page/PresentationSlidesView.tsx
@@
                   overlayContent={(() => {
                     const showHover = !isPresenting && !isReadOnly && isHovering && !editingSlideId && editingOverlaySlideId !== slide.id;
                     const inOverlayEdit = editingOverlaySlideId === slide.id;
-                    if (inOverlayEdit) {
-                      // 🔧 Kleines Top-Menü für persönliches Bild: Confirm + Delete
-                      return (
-                        <div className="absolute left-0 right-0 top-0 z-[5] flex justify-center pt-3 pointer-events-none">
-                          <div className="flex gap-2 rounded-full bg-black/50 backdrop-blur-md px-2 py-1 pointer-events-auto">
-                            <button
-                              onClick={() => {
-                                // Editmodus schließen (Änderungen sind bereits im Canvas-State)
-                                setEditingOverlaySlideId(null);
-                                // Auswahl leeren
-                                const { slides, setSlides } = usePresentationState.getState();
-                                const updated = slides.slice();
-                                const i = updated.findIndex((x) => x.id === slide.id);
-                                if (i >= 0) {
-                                  const c = (updated[i].canvas ?? docWithBg) as CanvasDoc;
-                                  updated[i] = { ...updated[i], canvas: { ...c, selection: [] } };
-                                  setSlides(updated);
-                                }
-                              }}
-                              className="flex items-center gap-2 rounded-full bg-emerald-500/90 hover:bg-emerald-500 text-white px-3 py-1.5 shadow"
-                              aria-label="Confirm"
-                              title="Confirm"
-                            >
-                              ✓
-                            </button>
-                            <button
-                              onClick={() => {
-                                const { slides, setSlides } = usePresentationState.getState();
-                                const updated = slides.slice();
-                                const i = updated.findIndex((x) => x.id === slide.id);
-                                if (i >= 0) {
-                                  const cur = updated[i];
-                                  const c = (cur.canvas ?? docWithBg) as CanvasDoc;
-                                  const nodes = (c.nodes ?? []).filter(
-                                    (n: any) => !(n?.type === "image" && n?.id === "user-overlay-image"),
-                                  );
-                                  updated[i] = { ...cur, canvas: { ...c, nodes, selection: [] } };
-                                  setSlides(updated);
-                                }
-                                setEditingOverlaySlideId(null);
-                              }}
-                              className="flex items-center gap-2 rounded-full bg-red-500/90 hover:bg-red-500 text-white px-3 py-1.5 shadow"
-                              aria-label="Delete Image"
-                              title="Delete Image"
-                            >
-                              🗑
-                            </button>
-                          </div>
-                        </div>
-                      );
-                    }
+                    if (inOverlayEdit) {
+                      return (
+                        <>
+                          <div className="absolute left-0 right-0 top-0 z-[6] flex justify-center pt-3 pointer-events-none">
+                            <div className="flex gap-2 rounded-full bg-black/50 backdrop-blur-md px-2 py-1 pointer-events-auto">
+                              <button
+                                onClick={() => {
+                                  setEditingOverlaySlideId(null);
+                                  const { slides, setSlides } = usePresentationState.getState();
+                                  const updated = slides.slice();
+                                  const i = updated.findIndex((x) => x.id === slide.id);
+                                  if (i >= 0) {
+                                    const c = (updated[i].canvas ?? docWithBg) as CanvasDoc;
+                                    updated[i] = { ...updated[i], canvas: { ...c, selection: [] } };
+                                    setSlides(updated);
+                                  }
+                                }}
+                                className="flex items-center gap-2 rounded-full bg-emerald-500/90 hover:bg-emerald-500 text-white px-3 py-1.5 shadow"
+                                aria-label="Confirm"
+                                title="Confirm"
+                              >
+                                ✓
+                              </button>
+                              <button
+                                onClick={() => {
+                                  const { slides, setSlides } = usePresentationState.getState();
+                                  const updated = slides.slice();
+                                  const i = updated.findIndex((x) => x.id === slide.id);
+                                  if (i >= 0) {
+                                    const cur = updated[i];
+                                    const c = (cur.canvas ?? docWithBg) as CanvasDoc;
+                                    const nodes = (c.nodes ?? []).filter(
+                                      (n: any) => !(n?.type === "image" && n?.id === "user-overlay-image"),
+                                    );
+                                    updated[i] = { ...cur, canvas: { ...c, nodes, selection: [] } };
+                                    setSlides(updated);
+                                  }
+                                  setEditingOverlaySlideId(null);
+                                }}
+                                className="flex items-center gap-2 rounded-full bg-red-500/90 hover:bg-red-500 text-white px-3 py-1.5 shadow"
+                                aria-label="Delete Image"
+                                title="Delete Image"
+                              >
+                                🗑
+                              </button>
+                            </div>
+                          </div>
+                          <OverlayImageEditorLayer slideId={slide.id} />
+                        </>
+                      );
+                    }
*** End Patch

*** Add File: src/components/presentation/presentation-page/OverlayImageEditorLayer.tsx
+import * as React from "react";
+import { usePresentationState } from "@/states/presentation-state";
+import type { CanvasDoc } from "@/canvas/types";
+
+export default function OverlayImageEditorLayer({ slideId }: { slideId: string }) {
+  const slides = usePresentationState((s) => s.slides);
+  const setSlides = usePresentationState((s) => s.setSlides);
+
+  const dragging = React.useRef(false);
+  const last = React.useRef<{ x: number; y: number } | null>(null);
+
+  const getCanvas = React.useCallback(() => {
+    const idx = slides.findIndex((s) => s.id === slideId);
+    if (idx < 0) return { idx: -1, c: null as CanvasDoc | null };
+    const c = (slides[idx].canvas ?? null) as CanvasDoc | null;
+    return { idx, c };
+  }, [slides, slideId]);
+
+  const getOverlayIndex = (c: CanvasDoc | null) =>
+    (c?.nodes ?? []).findIndex((n: any) => n?.type === "image" && n?.id === "user-overlay-image");
+
+  const mutate = (fn: (c: CanvasDoc, i: number) => void) => {
+    const { idx, c } = getCanvas();
+    if (idx < 0 || !c) return;
+    const overlayIdx = getOverlayIndex(c);
+    if (overlayIdx < 0) return;
+    const next: CanvasDoc = { ...c, nodes: [...(c.nodes ?? [])] };
+    fn(next, overlayIdx);
+    const updated = slides.slice();
+    updated[idx] = { ...updated[idx]!, canvas: next };
+    setSlides(updated);
+  };
+
+  const onMouseDown = (e: React.MouseEvent) => {
+    dragging.current = true;
+    last.current = { x: e.clientX, y: e.clientY };
+  };
+
+  const onMouseUp = () => {
+    dragging.current = false;
+    last.current = null;
+  };
+
+  const onMouseLeave = () => {
+    dragging.current = false;
+    last.current = null;
+  };
+
+  const onMouseMove = (e: React.MouseEvent) => {
+    if (!dragging.current || !last.current) return;
+    const dx = e.clientX - last.current.x;
+    const dy = e.clientY - last.current.y;
+    last.current = { x: e.clientX, y: e.clientY };
+    mutate((c, i) => {
+      const n = { ...(c.nodes[i] as any) };
+      n.x = (n.x ?? 0) + dx;
+      n.y = (n.y ?? 0) + dy;
+      c.nodes[i] = n;
+    });
+  };
+
+  const onWheel = (e: React.WheelEvent) => {
+    e.preventDefault();
+    const factor = e.deltaY < 0 ? 1.05 : 0.95;
+    mutate((c, i) => {
+      const n = { ...(c.nodes[i] as any) };
+      const prevW = n.width ?? c.width;
+      const prevH = n.height ?? c.height;
+      const newW = Math.max(20, prevW * factor);
+      const newH = Math.max(20, prevH * factor);
+      const cx = e.nativeEvent.offsetX;
+      const cy = e.nativeEvent.offsetY;
+      const px = (cx - (n.x ?? 0)) / prevW;
+      const py = (cy - (n.y ?? 0)) / prevH;
+      const nx = (n.x ?? 0) + (prevW - newW) * px;
+      const ny = (n.y ?? 0) + (prevH - newH) * py;
+      n.width = newW;
+      n.height = newH;
+      n.x = nx;
+      n.y = ny;
+      c.nodes[i] = n;
+    });
+  };
+
+  return (
+    <div
+      className="absolute inset-0 z-[5] cursor-grab active:cursor-grabbing"
+      onMouseDown={onMouseDown}
+      onMouseUp={onMouseUp}
+      onMouseLeave={onMouseLeave}
+      onMouseMove={onMouseMove}
+      onWheel={onWheel}
+      style={{ pointerEvents: "auto" }}
+      aria-label="Overlay image editor layer"
+    />
+  );
+}
*** End Patch