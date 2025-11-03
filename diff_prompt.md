Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/app/dashboard/image-collections/page.tsx
@@

-                  {previewImages.length ? (
-                    {/* add symmetric inner padding so previews don't hug the card edges */}
-                    <div className="overflow-hidden rounded-xl px-2">

*                  {previewImages.length ? (
*                    <>
*                      {/* add symmetric inner padding so previews don't hug the card edges */}
*                      <div className="overflow-hidden rounded-xl px-2">
  @@

-                      </div>
-                    </div>

*                      </div>
*                    </>
                     ) : (
                       <div className="text-xs text-muted-foreground">
                         No preview images available
                       </div>
                     )}
  @@

-            <button

*            {/* bump only the create-card height to match the preview cards */}
*            <button
               type="button"
               onClick={() => setCreating(true)}

-              /* bump only the create-card height to match the preview cards */
                 className="group flex w-full items-center justify-center rounded-xl border-2 border-dashed bg-card p-2 text-sm text-muted-foreground transition hover:border-muted-foreground/60 hover:text-foreground min-h-[136px] md:min-h-[168px] lg:min-h-[200px]"
               >
                 <div className="flex items-center gap-2">
                   <Plus className="h-4 w-4" />
                   Create collection
                 </div>
               </button>
  \*\*\* End Patch
