Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/app/dashboard/image-collections/page.tsx
@@

-                <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
-                  <img src={image.url} alt={image.filename} className="h-full w-full object-cover" />

*                <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
*                  <img src={image.url} alt={image.filename} className="max-h-full max-w-full object-contain" />
                     <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                       <Button variant="destructive" size="sm" onClick={() => deleteImage(image.id)} className="gap-2">
                         <Trash2 className="h-3 w-3" />
                         Delete
                       </Button>
                     </div>
                   </div>
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/app/dashboard/image-collections/page.tsx
  @@

-                          <img
-                            src={image.url}
-                            alt={`All images preview ${index + 1}`}
-                            className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
-                            loading="lazy"
-                          />

*                          <img
*                            src={image.url}
*                            alt={`All images preview ${index + 1}`}
*                            className="max-h-full max-w-full object-contain transition-opacity group-hover:opacity-80"
*                            loading="lazy"
*                          />
  @@

-                          <img
-                            src={image.url}
-                            alt={`${set.name} preview ${index + 1}`}
-                            className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
-                            loading="lazy"
-                          />

*                          <img
*                            src={image.url}
*                            alt={`${set.name} preview ${index + 1}`}
*                            className="max-h-full max-w-full object-contain transition-opacity group-hover:opacity-80"
*                            loading="lazy"
*                          />
  \*\*\* End Patch
