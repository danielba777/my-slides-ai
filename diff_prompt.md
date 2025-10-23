Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

*** Begin Patch
*** Update File: src/canvas/LegacyEditorToolbar.tsx
@@
       <div className="flex items-center justify-between gap-2 px-3 py-1.5">
         <div className="flex items-center gap-2">
-          {/* + Text */}
-          <Button
-            size="icon"
-            variant="secondary"
-            className="rounded-xl"
-            onClick={handleAdd}
-            aria-label="Text hinzufügen"
-            title="Text hinzufügen"
-          >
-            <Plus className="h-4 w-4" />
-          </Button>
-
-          {/* Bold / Italic */}
-          <Button size="icon" variant="ghost" className="rounded-xl">
-            <span className="font-bold text-base">B</span>
-          </Button>
-          <Button size="icon" variant="ghost" className="rounded-xl italic">
-            I
-          </Button>
-
-          {/* Align */}
-          <div className="flex items-center gap-1 rounded-xl border px-1.5 py-1">
-            <Button size="icon" variant="ghost" className="rounded-md">
-              <AlignLeft className="h-4 w-4" />
-            </Button>
-            <Button size="icon" variant="ghost" className="rounded-md">
-              <AlignCenter className="h-4 w-4" />
-            </Button>
-            <Button size="icon" variant="ghost" className="rounded-md">
-              <AlignRight className="h-4 w-4" />
-            </Button>
-          </div>
+          {/* Text hinzufügen */}
+          <Button
+            variant="secondary"
+            className="rounded-xl px-3"
+            onClick={handleAdd}
+            aria-label="Text hinzufügen"
+            title="Text hinzufügen"
+          >
+            <Plus className="mr-1 h-4 w-4" /> Text +
+          </Button>
+
+          {/* Bold / Italic */}
+          <Button
+            size="icon"
+            variant="ghost"
+            className={cn("rounded-xl", hasSelection ? "" : "opacity-50")}
+            onClick={() => {
+              if (!hasSelection) return;
+              commitBackground({}); // force rerender
+              onChangeSelectedText?.({
+                ...selectedText!,
+                fontWeight:
+                  (selectedText as any)?.fontWeight === "bold" ? "normal" : "bold",
+              });
+            }}
+          >
+            <span className="font-bold text-base">B</span>
+          </Button>
+          <Button
+            size="icon"
+            variant="ghost"
+            className={cn("rounded-xl italic", hasSelection ? "" : "opacity-50")}
+            onClick={() => {
+              if (!hasSelection) return;
+              onChangeSelectedText?.({
+                ...selectedText!,
+                fontStyle:
+                  (selectedText as any)?.fontStyle === "italic" ? "normal" : "italic",
+              });
+            }}
+          >
+            I
+          </Button>
+
+          {/* Text-Ausrichtung */}
+          <div className="flex items-center gap-1 rounded-xl border px-1.5 py-1">
+            <Button
+              size="icon"
+              variant="ghost"
+              className="rounded-md"
+              onClick={() =>
+                hasSelection &&
+                onChangeSelectedText?.({
+                  ...selectedText!,
+                  align: "left",
+                })
+              }
+            >
+              <AlignLeft className="h-4 w-4" />
+            </Button>
+            <Button
+              size="icon"
+              variant="ghost"
+              className="rounded-md"
+              onClick={() =>
+                hasSelection &&
+                onChangeSelectedText?.({
+                  ...selectedText!,
+                  align: "center",
+                })
+              }
+            >
+              <AlignCenter className="h-4 w-4" />
+            </Button>
+            <Button
+              size="icon"
+              variant="ghost"
+              className="rounded-md"
+              onClick={() =>
+                hasSelection &&
+                onChangeSelectedText?.({
+                  ...selectedText!,
+                  align: "right",
+                })
+              }
+            >
+              <AlignRight className="h-4 w-4" />
+            </Button>
+          </div>
         </div>
       </div>
@@
           <CollapsibleContent>
             <div className="flex flex-wrap items-center gap-3 py-3">
-              <MiniRange
-                label="Padding"
-                min={0}
-                max={48}
-                value={textBgPadding}
-                onChange={(v) => {
-                  setTextBgPadding(v);
-                  commitBackground({ paddingX: v, paddingY: v });
-                }}
-              />
-              <MiniRange
-                label="Rundung"
-                min={0}
-                max={64}
-                value={textBgRadius}
-                onChange={(v) => {
-                  setTextBgRadius(v);
-                  commitBackground({ radius: v });
-                }}
-              />
-              <MiniRange
-                label="Transparenz"
-                min={0}
-                max={100}
-                value={textBgOpacity}
-                onChange={(v) => {
-                  setTextBgOpacity(v);
-                  commitBackground({ opacity: v / 100 });
-                }}
-              />
-              <div className="flex items-center gap-1">
-                <span className="text-[10px] text-muted-foreground">Farbe</span>
-                <input
-                  type="color"
-                  value={textBgColor}
-                  onChange={(e) => {
-                    const c = e.currentTarget.value;
-                    setTextBgColor(c);
-                    commitBackground({ color: c });
-                  }}
-                  className="h-6 w-7 cursor-pointer rounded-md border border-border bg-background p-0.5"
-                />
-              </div>
-              <DropdownMenu>
-                <DropdownMenuTrigger asChild>
-                  <Button variant="outline" size="sm" className="rounded-xl">
-                    Modus: {textBgMode === "block" ? "Block" : "Blob"}
-                    <ChevronDown className="ml-1 h-4 w-4" />
-                  </Button>
-                </DropdownMenuTrigger>
-                <DropdownMenuContent>
-                  <DropdownMenuItem onClick={() => { setTextBgMode("block"); commitBackground({ mode: "block" }); }}>
-                    Block
-                  </DropdownMenuItem>
-                  <DropdownMenuItem onClick={() => { setTextBgMode("blob"); commitBackground({ mode: "blob" }); }}>
-                    Blob
-                  </DropdownMenuItem>
-                </DropdownMenuContent>
-              </DropdownMenu>
+              {/* Einheitliche Regler und Eingaben */}
+              <MiniRange label="Textgröße" min={8} max={128} value={(selectedText as any)?.fontSize ?? 32}
+                onChange={(v) => hasSelection && onChangeSelectedText?.({ ...selectedText!, fontSize: v })} />
+
+              <MiniRange label="Zeilenhöhe" min={80} max={200} value={(selectedText as any)?.lineHeight ?? 120}
+                onChange={(v) => hasSelection && onChangeSelectedText?.({ ...selectedText!, lineHeight: v / 100 })} />
+
+              <MiniRange label="Buchstabenabstand" min={0} max={20} value={(selectedText as any)?.letterSpacing ?? 0}
+                onChange={(v) => hasSelection && onChangeSelectedText?.({ ...selectedText!, letterSpacing: v })} />
+
+              <MiniRange label="Padding" min={0} max={48} value={textBgPadding}
+                onChange={(v) => { setTextBgPadding(v); commitBackground({ paddingX: v, paddingY: v }); }} />
+
+              <MiniRange label="Rundung" min={0} max={64} value={textBgRadius}
+                onChange={(v) => { setTextBgRadius(v); commitBackground({ radius: v }); }} />
+
+              <MiniRange label="Transparenz" min={0} max={100} value={textBgOpacity}
+                onChange={(v) => { setTextBgOpacity(v); commitBackground({ opacity: v / 100 }); }} />
+
+              <div className="flex items-center gap-2">
+                <span className="text-[10px] text-muted-foreground">Textfarbe</span>
+                <input
+                  type="color"
+                  value={(selectedText as any)?.fill ?? "#ffffff"}
+                  onChange={(e) =>
+                    hasSelection &&
+                    onChangeSelectedText?.({ ...selectedText!, fill: e.currentTarget.value })
+                  }
+                  className="h-6 w-7 cursor-pointer rounded-md border border-border bg-background p-0.5"
+                />
+              </div>
+
+              <div className="flex items-center gap-2">
+                <span className="text-[10px] text-muted-foreground">Hintergrund</span>
+                <input
+                  type="color"
+                  value={textBgColor}
+                  onChange={(e) => {
+                    const c = e.currentTarget.value;
+                    setTextBgColor(c);
+                    commitBackground({ color: c });
+                  }}
+                  className="h-6 w-7 cursor-pointer rounded-md border border-border bg-background p-0.5"
+                />
+              </div>
+
+              <MiniRange label="Konturstärke" min={0} max={20} value={(selectedText as any)?.strokeWidth ?? 0}
+                onChange={(v) =>
+                  hasSelection &&
+                  onChangeSelectedText?.({
+                    ...selectedText!,
+                    strokeWidth: v,
+                    strokeEnabled: v > 0,
+                  })
+                }
+              />
+
+              <div className="flex items-center gap-2">
+                <span className="text-[10px] text-muted-foreground">Konturfarbe</span>
+                <input
+                  type="color"
+                  value={(selectedText as any)?.stroke ?? "#000000"}
+                  onChange={(e) =>
+                    hasSelection &&
+                    onChangeSelectedText?.({ ...selectedText!, stroke: e.currentTarget.value })
+                  }
+                  className="h-6 w-7 cursor-pointer rounded-md border border-border bg-background p-0.5"
+                />
+              </div>
+
+              <DropdownMenu>
+                <DropdownMenuTrigger asChild>
+                  <Button variant="outline" size="sm" className="rounded-xl">
+                    Modus: {textBgMode === "block" ? "Block" : "Blob"}
+                    <ChevronDown className="ml-1 h-4 w-4" />
+                  </Button>
+                </DropdownMenuTrigger>
+                <DropdownMenuContent>
+                  <DropdownMenuItem onClick={() => { setTextBgMode("block"); commitBackground({ mode: "block" }); }}>
+                    Block
+                  </DropdownMenuItem>
+                  <DropdownMenuItem onClick={() => { setTextBgMode("blob"); commitBackground({ mode: "blob" }); }}>
+                    Blob
+                  </DropdownMenuItem>
+                </DropdownMenuContent>
+              </DropdownMenu>
             </div>
           </CollapsibleContent>
*** End Patch