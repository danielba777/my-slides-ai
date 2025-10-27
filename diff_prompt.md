Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch _**
**_ Update File: src/canvas/legacy/SlideCanvasLegacy.tsx _**
@@
-                      <div
-                        data-role="handle"
-                        title="Breite ändern (links)"
-                        className="absolute left-0 top-1/2 w-9 h-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center"
-                        style={{ pointerEvents: "auto" }}
-                        onPointerDown={(e) =>
-                          startResize(layer.id, "resize-left", e)
-                        }
-                      >
+                      <div
+                        data-role="handle"
+                        title="Breite ändern (links)"
+                        className="absolute left-0 top-1/2 w-12 h-24 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center z-[60]"
+                        style={{ pointerEvents: "auto" }}
+                        onPointerDown={(e) => {
+                          e.stopPropagation();
+                          startResize(layer.id, "resize-left", e);
+                        }}
+                      >
                         <div className="h-16 w-[12px] rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                       </div>
@@
-                      <div
-                        data-role="handle"
-                        title="Breite ändern (rechts)"
-                        className="absolute right-0 top-1/2 w-7 h-10 translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center"
-                        style={{ pointerEvents: "auto" }}
-                        onPointerDown={(e) =>
-                          startResize(layer.id, "resize-right", e)
-                        }
-                      >
+                      <div
+                        data-role="handle"
+                        title="Breite ändern (rechts)"
+                        className="absolute right-0 top-1/2 w-12 h-24 translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center z-[60]"
+                        style={{ pointerEvents: "auto" }}
+                        onPointerDown={(e) => {
+                          e.stopPropagation();
+                          startResize(layer.id, "resize-right", e);
+                        }}
+                      >
                         <div className="h-16 w-[12px] rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                       </div>
@@
-                      <div
-                        data-role="handle"
-                        title="Höhe (oben)"
-                        className="absolute top-0 left-1/2 w-10 h-7 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize flex items-center justify-center"
-                        style={{ pointerEvents: "auto" }}
-                        onPointerDown={(e) =>
-                          startResize(layer.id, "resize-top", e)
-                        }
-                      >
+                      <div
+                        data-role="handle"
+                        title="Höhe (oben)"
+                        className="absolute top-0 left-1/2 w-28 h-10 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize flex items-center justify-center z-[60]"
+                        style={{ pointerEvents: "auto" }}
+                        onPointerDown={(e) => {
+                          e.stopPropagation();
+                          startResize(layer.id, "resize-top", e);
+                        }}
+                      >
                         <div className="h-[12px] w-16 rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                       </div>
@@
-                      <div
-                        data-role="handle"
-                        title="Höhe (unten)"
-                        className="absolute bottom-0 left-1/2 w-10 h-7 -translate-x-1/2 translate-y-1/2 cursor-ns-resize flex items-center justify-center"
-                        style={{ pointerEvents: "auto" }}
-                        onPointerDown={(e) =>
-                          startResize(layer.id, "resize-bottom", e)
-                        }
-                      >
+                      <div
+                        data-role="handle"
+                        title="Höhe (unten)"
+                        className="absolute bottom-0 left-1/2 w-28 h-10 -translate-x-1/2 translate-y-1/2 cursor-ns-resize flex items-center justify-center z-[60]"
+                        style={{ pointerEvents: "auto" }}
+                        onPointerDown={(e) => {
+                          e.stopPropagation();
+                          startResize(layer.id, "resize-bottom", e);
+                        }}
+                      >
                         <div className="h-[12px] w-16 rounded bg-white border border-blue-500 shadow-sm pointer-events-none" />
                       </div>
**_ End Patch _**
