Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/app/dashboard/image-collections/page.tsx
@@
-                  {previewImages.length ? (
-                    <div className="overflow-hidden">
-                      <div className="grid grid-cols-5 gap-0">
+                  {previewImages.length ? (
+                    {/* stretch preview to full card width (cancel inner p-2) */}
+                    <div className="overflow-hidden -mx-2">
+                      <div className="grid grid-cols-5 gap-0">
                         {previewImages.map((image, index) => (
                           <div
                             key={image.id ?? `${set.id}-${index}`}
                             className={cn(
-                              "relative h-24 overflow-hidden md:h-32 lg:h-40",
+                              "relative h-24 overflow-hidden md:h-32 lg:h-40",
                               index === 0 && "rounded-l-lg",
                               index === previewImages.length - 1 &&
                                 "rounded-r-lg",
                             )}
                           >
                             <img
                               src={image.url}
                               alt={`${set.name} preview ${index + 1}`}
-                              className="block h-full w-full object-cover transition-opacity group-hover:opacity-80"
+                              className="block h-full w-full object-cover transition-opacity group-hover:opacity-80"
                               loading="lazy"
                             />
                           </div>
                         ))}
                       </div>
                     </div>
                   ) : (
@@
-            <button
+            <button
               type="button"
               onClick={() => setCreating(true)}
-              className="group flex w-full items-center justify-center rounded-xl border-2 border-dashed bg-card p-2 text-sm text-muted-foreground transition hover:border-muted-foreground/60 hover:text-foreground h-24 md:h-32 lg:h-40"
+              /* match the visual height of image cards (image area + header + padding) */
+              className="group flex w-full items-center justify-center rounded-xl border-2 border-dashed bg-card p-2 text-sm text-muted-foreground transition hover:border-muted-foreground/60 hover:text-foreground min-h-[9.5rem] md:min-h-[12rem] lg:min-h-[14rem]"
             >
               <div className="flex items-center gap-2">
                 <Plus className="h-4 w-4" />
                 Create collection
               </div>
             </button>
**_ End Patch