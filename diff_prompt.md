Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/components/presentation/presentation-page/SlideContainer.tsx
@@
-import { GripVertical, Plus, Trash } from "lucide-react";
+import { GripVertical, Plus, Trash, ArrowRight } from "lucide-react";
@@

- const { addSlide, deleteSlideAt } = useSlideOperations();

* const { addSlide, deleteSlideAt } = useSlideOperations();
* // For random image swap based on the currently selected (sub)category
* const slides = usePresentationState((s) => s.slides);
* const setSlides = usePresentationState((s) => s.setSlides);
* const activeImageSetId = usePresentationState((s) => s.imageSetId);
  @@
  const deleteSlide = () => {
  deleteSlideAt(index);
  };
*
* // Collect all image URLs from a given image set (including children)
* async function collectImagesFromSetTree(imageSetId: string): Promise<string[]> {
* try {
*      const res = await fetch("/api/imagesets");
*      if (!res.ok) return [];
*      const allSets = (await res.json()) as Array<any>;
*
*      const byId = new Map<string, any>();
*      allSets.forEach((s) => byId.set(s.id, s));
*
*      const start = byId.get(imageSetId);
*      if (!start) return [];
*
*      const stack: any[] = [start];
*      const urls: string[] = [];
*      while (stack.length) {
*        const cur = stack.pop();
*        if (Array.isArray(cur?.images)) {
*          cur.images.forEach((img: any) => img?.url && urls.push(img.url));
*        }
*        if (Array.isArray(cur?.children)) {
*          cur.children.forEach((ch: any) => stack.push(ch));
*        } else if (cur?._count?.children > 0 && Array.isArray(allSets)) {
*          // Fallback if children not materialized
*          allSets.forEach((s) => {
*            if (s?.parentId === cur.id) stack.push(s);
*          });
*        }
*      }
*      return urls;
* } catch {
*      return [];
* }
* }
*
* // Action: pick next random image from the active (sub)category and swap into this slide
* const handleNextRandomImage = async () => {
* if (!activeImageSetId) {
*      console.warn("No image set selected. Pick a category in 'Edit Image' first.");
*      return;
* }
* const urls = await collectImagesFromSetTree(activeImageSetId);
* if (urls.length === 0) {
*      console.warn("Selected image set has no images.");
*      return;
* }
* const nextUrl = urls[Math.floor(Math.random() * urls.length)];
* const updated = slides.slice();
* const cur = updated[index];
* if (!cur) return;
* updated[index] = {
*      ...cur,
*      rootImage: {
*        ...(cur.rootImage ?? {}),
*        url: nextUrl,
*      },
* };
* setSlides(updated);
* };
  @@

-              <button

*              <button
                 ref={setActivatorNodeRef as React.Ref<HTMLButtonElement>}
                 {.listeners}
                 {.attributes}

-                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:outline-none"
-                aria-label="Folienposition ziehen"
-                title="Verschieben"

*                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:outline-none"
*                aria-label="Drag slide position"
*                title="Move"
               >
                 <GripVertical className="h-4 w-4" />
               </button>

               {/* Neuer: Persönliche Bilder (ersetzt den Edit/Canvas-Button) */}
               <PersonalImagePickerButton index={index} />

*              {/* Next random image from active category */}
*              <Button
*                variant="ghost"
*                size="icon"
*                className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
*                onClick={handleNextRandomImage}
*                aria-label="Next image"
*                title="Next image"
*              >
*                <ArrowRight className="h-4 w-4" />
*              </Button>
*               {/* Neue Folie darunter */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
                  onClick={() => addSlide("after", index)}

-                aria-label="Neue Folie darunter"
-                title="Neue Folie darunter"

*                aria-label="Add next slide"
*                title="Add next slide"
               >
                 <Plus className="h-4 w-4" />
               </Button>

               {/* Löschen */}
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-9 w-9 rounded-md text-muted-foreground hover:text-destructive"

-                    aria-label="Folie löschen"
-                    title="Folie löschen"

*                    aria-label="Delete slide"
*                    title="Delete slide"
                     >
                       <Trash className="h-4 w-4" />
                     </Button>
                   </AlertDialogTrigger>
  \*\*\_ End Patch
