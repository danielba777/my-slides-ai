Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

--- a/src/components/presentation/presentation-page/PersonalImageSelectorDialog.tsx
+++ b/src/components/presentation/presentation-page/PersonalImageSelectorDialog.tsx
@@ -... +... @@

-        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
-          <Button variant="ghost" asChild>
-            <Link href="/dashboard/image-collections">Manage collections</Link>
-          </Button>

*        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
*          <Link href="/dashboard/image-collections">
*            <Button variant="ghost">Manage collections</Button>
*          </Link>
           <div className="flex items-center gap-2">
             <Button variant="outline" onClick={() => onOpenChange(false)}>
               Cancel
             </Button>
             <Button onClick={handleApply} disabled={!selectedImageUrl}>
               Apply Image
             </Button>
           </div>
         </div>
