Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/components/presentation/dashboard/ImageCollectionSelector.tsx
@@

<div className="overflow-hidden">
<div className="grid grid-cols-5 gap-0">
{getPreviewImages(selectedImageSet).map(
(image, index, arr) => (
<div
key={image.id ?? `${selectedImageSet.id}-${index}`}
className={cn(
"relative h-24 md:h-32 lg:h-40 overflow-hidden",
index === 0 && "rounded-l-lg",
index === arr.length - 1 && "rounded-r-lg",
)} >

-                          <img

*                          <img
                             src={image.url}
                             alt={`${selectedImageSet.name} preview ${index + 1}`}

-                            className="max-h-full max-w-full object-contain bg-black/5"

*                            className="block h-full w-full object-cover"
                               loading="lazy"
                             />
                           </div>
                         ),
                       )}
                     </div>
                   </div>
  \*\*\* End Patch
  Und zusätzlich noch die andere Preview-Stelle im gleichen File (Liste der Sets), die ebenfalls noch object-contain nutzt — ebenfalls minimal auf object-cover + block, damit es überall konsistent aussieht:
  codebase

diff
Code kopieren
**_ Begin Patch
_** Update File: src/components/presentation/dashboard/ImageCollectionSelector.tsx
@@ >

-                          <img

*                          <img
                             src={image.url}
                             alt={`${set.name} preview ${index + 1}`}

-                            className="max-h-full max-w-full object-contain bg-black/5 transition-opacity group-hover:opacity-80"

*                            className="block h-full w-full object-cover transition-opacity group-hover:opacity-80"
                               loading="lazy"
                             />
                           </div>
                         ))}
                       </div>
                     </div>
  \*\*\* End Patch
