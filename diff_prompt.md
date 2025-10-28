Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/components/presentation/presentation-page/SlideContainer.tsx
@@
const { addSlide, deleteSlideAt } = useSlideOperations();

- const slides = usePresentationState((s) => s.slides);
- const setSlides = usePresentationState((s) => s.setSlides);
- const activeImageSetId = usePresentationState((s) => s.imageSetId);
  @@
  const deleteSlide = () => {
  deleteSlideAt(index);
  };

- // Helper: Alle Bilder eines Sets (inkl. Kind-Sets) einsammeln
- async function collectImagesFromSetTree(imageSetId: string): Promise<string[]> {
- try {
-      const res = await fetch("/api/imagesets");
-      if (!res.ok) return [];
-      const allSets = (await res.json()) as Array<any>;
-
-      const byId = new Map<string, any>();
-      allSets.forEach((s) => byId.set(s.id, s));
-
-      const start = byId.get(imageSetId);
-      if (!start) return [];
-
-      const stack: any[] = [start];
-      const urls: string[] = [];
-      while (stack.length) {
-        const cur = stack.pop();
-        if (Array.isArray(cur?.images)) {
-          cur.images.forEach((img: any) => img?.url && urls.push(img.url));
-        }
-        if (Array.isArray(cur?.children)) {
-          cur.children.forEach((ch: any) => stack.push(ch));
-        } else if (cur?._count?.children > 0 && Array.isArray(allSets)) {
-          // Fallback: falls Kinder nicht materialisiert sind, nimm alle mit parentId === cur.id
-          allSets.forEach((s) => {
-            if (s?.parentId === cur.id) stack.push(s);
-          });
-        }
-      }
-      return urls;
- } catch {
-      return [];
- }
- }
-
- // Aktion: Nächstes Random-Bild aus der aktiven Kategorie setzen
- const handleNextRandomImage = async () => {
- const slide = slides[index];
- if (!slide || !activeImageSetId) {
-      // Kein aktives Set gewählt → sanfter Hinweis
-      console.warn("No image set selected. Pick a category in 'Edit Image' first.");
-      return;
- }
-
- const urls = await collectImagesFromSetTree(activeImageSetId);
- if (urls.length === 0) {
-      console.warn("Selected image set has no images.");
-      return;
- }
- const nextUrl = urls[Math.floor(Math.random() * urls.length)];
-
- // Single-Image: url austauschen. Grid lassen wir unverändert (User-Anforderung bezog sich auf „das Bild“).
- const updated = slides.slice();
- const cur = updated[index];
- updated[index] = {
-      ...cur,
-      rootImage: {
-        ...(cur?.rootImage ?? {}),
-        url: nextUrl,
-      },
- };
- setSlides(updated);
- };
- return (
  <div
  ref={setNodeRef}
  style={style}
  className={cn(
  @@
  {!isPresenting && !isReadOnly && (
  <div
  className={cn(
  "z-[1001] mt-3 w-full",
  )}
  aria-label="Slide toolbar" >
  <div className="mx-auto flex w-full max-w-[760px] items-center justify-center gap-2 rounded-md bg-background/95 p-2 shadow-sm backdrop-blur">
  {/_ Drag-Handle _/}
  <button
  ref={setActivatorNodeRef as React.Ref<HTMLButtonElement>}
  {...listeners}
  {...attributes}

*                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:outline-none"
*                aria-label="Folienposition ziehen"
*                title="Verschieben"

-                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:outline-none"
-                aria-label="Drag slide position"
-                title="Move"
               >
                 <GripVertical className="h-4 w-4" />
               </button>

               {/* Neuer: Persönliche Bilder (ersetzt den Edit/Canvas-Button) */}
               <PersonalImagePickerButton index={index} />

-
-              {/* Next random image from active category */}
-              <Button
-                variant="ghost"
-                size="icon"
-                className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
-                onClick={handleNextRandomImage}
-                aria-label="Next image"
-                title="Next image"
-              >
-                <ArrowRight className="h-4 w-4" />
-              </Button>

               {/* Neue Folie darunter */}
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
                 onClick={() => addSlide("after", index)}

*                aria-label="Neue Folie darunter"
*                title="Neue Folie darunter"

-                aria-label="Add slide below"
-                title="Add slide below"
                 >
                   <Plus className="h-4 w-4" />
                 </Button>

                 {/* Löschen */}
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  _\*\* Update File: src/components/plate/ui/fixed-toolbar-buttons.tsx
  @@
  return (
  <div className="flex w-full">
  {/_ Linke Sektion: immer sichtbarer "Text +" Button \*/}
  <ToolbarGroup>
  <button
  onClick={handleAddText}

*          aria-label="Text hinzufügen"
*          title="Text hinzufügen"

-          aria-label="Add text"
-          title="Add text"
             className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-border/80 bg-background/90 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-0 h-9 w-9"
           >
             <Plus className="h-4 w-4" />
           </button>
         </ToolbarGroup>
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/components/presentation/presentation-page/SingleSlideImageSelector.tsx
  @@
  -interface SingleSlideImageSelectorProps {
  +interface SingleSlideImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;

* onSelectImage: (imageUrl: string) => void;

- onSelectImage: (imageUrl: string, imageSetId?: string) => void;
  }
  @@

* const handleSelectImage = (imageUrl: string) => {
* setPendingImageUrl(imageUrl);

- const handleSelectImage = (imageUrl: string) => {
- setPendingImageUrl(imageUrl);
  };
  @@

* const handleSave = () => {
* if (pendingImageUrl) {
*      onSelectImage(pendingImageUrl);
*      onClose();
* }
* };

- const handleSave = () => {
- if (pendingImageUrl) {
-      onSelectImage(pendingImageUrl, selectedSet?.id ?? drillDownParent?.id ?? undefined);
-      onClose();
- }
- };
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/components/presentation/presentation-page/PresentationSlidesView.tsx
  @@

* // Handler für die Bild-Auswahl
* const handleImageSelect = (imageUrl: string) => {

- // Handler für die Bild-Auswahl
- const handleImageSelect = (imageUrl: string, imageSetId?: string) => {
  const { slides, setSlides } = usePresentationState.getState();
  const updated = slides.slice();
  const i = updated.findIndex((x) => x.id === slide.id);
  if (i < 0) return;

  const currentSlide = updated[i];
  if (!currentSlide) return;

  // Update nur das rootImage dieser Slide
  updated[i] = {

*      ...currentSlide,
*      rootImage: { url: imageUrl, query: "" },

-      ...currentSlide,
-      rootImage: { ...(currentSlide.rootImage ?? {}), url: imageUrl, query: "" },
       };
       setSlides(updated);
  };
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/components/presentation/editor/custom-elements/root-image.tsx
  @@

* const handleSingleImageSelect = (imageUrl: string) => {

- const handleSingleImageSelect = (imageUrl: string, \_imageSetId?: string) => {
  setSlides(
  slides.map((slide, index) => {
  if (slideIndex !== index) return slide;
  return {
  ...slide,
  rootImage: {

*            ...(slide.rootImage!),
*            url: imageUrl,

-            ...(slide.rootImage!),
-            url: imageUrl,
             },
           };
         }),
       );
  };
  \*\*\* End Patch
