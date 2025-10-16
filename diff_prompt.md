Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

src/components/presentation/presentation-page/SlideContainer.tsx
@@
export function SlideContainer({
children,
index,
id,
className,
isReadOnly = false,
slideWidth,
slidesCount,
}: SlideContainerProps) {
@@

- const {
- attributes,
- listeners,
- setNodeRef,
- setActivatorNodeRef,
- transform,
- transition,
- isDragging,
- } = useSortable({

* const {
* attributes,
* listeners,
* setNodeRef,
* setActivatorNodeRef,
* transform,
* transition,
* isDragging,
* } = useSortable({
  id,
  disabled: isPresenting || isReadOnly,
  });
  @@
  const deleteSlide = () => {
  deleteSlideAt(index);
  };
  return (
  <div
  ref={setNodeRef}
  style={style}
  className={cn(

-        "group/card-container relative z-10 grid w/full place-items-center pb-6",

*        "group/card-container relative z-10 grid w-full place-items-center pb-6",
         className,
       )}
       data-slide-index={index}
  >

-      {/* Drag handle + Actions (oben rechts) */}
-      {!isPresenting && !isReadOnly && (
-        <div className="absolute right-6 top-6 z-[1001] flex items-center gap-2">
-          <button
-            ref={setActivatorNodeRef as React.Ref<HTMLButtonElement>}
-            {...listeners}
-            {...attributes}
-            className={cn(
-              "flex h-8 w-8 items-center justify-center rounded-md border bg-background/95 text-muted-foreground shadow-sm backdrop-blur",
-            )}
-            aria-label="Drag slide"
-          >
-            <GripVertical className="h-4 w-4" />
-          </button>
-
-          <SlideEditPopover index={index} />
-
-          <AlertDialog>
-            <AlertDialogTrigger asChild>
-              <Button
-                variant="ghost"
-                size="icon"
-                className="h-8 w-8 rounded-md border text-muted-foreground hover:text-destructive"
-              >
-                <Trash className="h-4 w-4" />
-              </Button>
-            </AlertDialogTrigger>
-            <AlertDialogContent>
-              <AlertDialogHeader>
-                <AlertDialogTitle>Delete Slide</AlertDialogTitle>
-                <AlertDialogDescription>
-                  Are you sure you want to delete slide {index + 1}? This action cannot be undone.
-                </AlertDialogDescription>
-              </AlertDialogHeader>
-              <AlertDialogFooter>
-                <AlertDialogCancel>Cancel</AlertDialogCancel>
-                <AlertDialogAction asChild>
-                  <Button variant="destructive" onClick={deleteSlide}>
-                    Delete
-                  </Button>
-                </AlertDialogAction>
-              </AlertDialogFooter>
-            </AlertDialogContent>
-          </AlertDialog>
-        </div>
-      )}

*      {/* Linke, vertikale Toolbar (immer sichtbar, stört nicht den Editor) */}
*      {!isPresenting && !isReadOnly && (
*        <div
*          className={cn(
*            "absolute top-1/2 -translate-y-1/2 -left-14 z-[1001]",
*          )}
*          aria-label="Slide toolbar"
*        >
*          <div className="flex flex-col items-center gap-2">
*            {/* Drag-Handle */}
*            <button
*              ref={setActivatorNodeRef as React.Ref<HTMLButtonElement>}
*              {...listeners}
*              {...attributes}
*              className="flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background/95 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground"
*              aria-label="Folienposition ziehen"
*              title="Verschieben"
*            >
*              <GripVertical className="h-4 w-4" />
*            </button>
*
*            {/* Slide-Einstellungen */}
*            <div className="rounded-md border border-border/70 bg-background/95 shadow-sm backdrop-blur">
*              <SlideEditPopover index={index} />
*            </div>
*
*            {/* Neues Canvas unter aktueller Folie */}
*            <Button
*              variant="ghost"
*              size="icon"
*              className="h-9 w-9 rounded-md border border-border/70 bg-background/95 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground"
*              onClick={() => addSlide("after", index)}
*              aria-label="Neue Folie darunter"
*              title="Neue Folie darunter"
*            >
*              <Plus className="h-4 w-4" />
*            </Button>
*
*            {/* Löschen */}
*            <AlertDialog>
*              <AlertDialogTrigger asChild>
*                <Button
*                  variant="ghost"
*                  size="icon"
*                  className="h-9 w-9 rounded-md border border-border/70 bg-background/95 text-muted-foreground shadow-sm backdrop-blur hover:text-destructive"
*                  aria-label="Folie löschen"
*                  title="Folie löschen"
*                >
*                  <Trash className="h-4 w-4" />
*                </Button>
*              </AlertDialogTrigger>
*              <AlertDialogContent>
*                <AlertDialogHeader>
*                  <AlertDialogTitle>Delete Slide</AlertDialogTitle>
*                  <AlertDialogDescription>
*                    Are you sure you want to delete slide {index + 1}? This action cannot be undone.
*                  </AlertDialogDescription>
*                </AlertDialogHeader>
*                <AlertDialogFooter>
*                  <AlertDialogCancel>Cancel</AlertDialogCancel>
*                  <AlertDialogAction asChild>
*                    <Button variant="destructive" onClick={deleteSlide}>
*                      Delete
*                    </Button>
*                  </AlertDialogAction>
*                </AlertDialogFooter>
*              </AlertDialogContent>
*            </AlertDialog>
*          </div>
*        </div>
*      )}

         {/* Slide Content */}
         <div
           className={cn(
             "relative w-[1024px] max-w-full",
             slideWidth,
             dragTransparent && "opacity-70",
             currentSlideIndex === index && "presentation-slide",
           )}
           onClick={() => setCurrentSlideIndex(index)}
         >
  @@

-        {/* Hover “+ oben/unten” entfernt, um Überlappung zu vermeiden */}
-      {!isPresenting && !isReadOnly && (
-        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover/card-container:opacity-100">
-          <Button
-            variant="ghost"
-            size="icon"
-            className="h-9 w-9 rounded-full border border-border/70 bg-background/95 text-muted-foreground shadow-lg backdrop-blur hover:text-foreground"
-            onClick={() => addSlide("before", index)}
-          >
-            <Plus className="h-4 w-4" />
-          </Button>
-        </div>
-      )}
-
-      {!isPresenting && !isReadOnly && (
-        <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover/card-container:opacity-100">
-          <Button
-            variant="ghost"
-            size="icon"
-            className="h-9 w-9 rounded-full border border-border/70 bg-background/95 text-muted-foreground shadow-lg backdrop-blur hover:text-foreground"
-            onClick={() => addSlide("after", index)}
-          >
-            <Plus className="h-4 w-4" />
-          </Button>
-        </div>
-      )}

*        {/* Hinweis: die früheren schwebenden + Buttons oben/unten wurden entfernt */}

          {isPresenting && (
            <div className="absolute bottom-0.5 left-1 right-1 z-[1001]">
              <div className="flex h-1.5 w-full gap-1">
                {Array.from({ length: slidesCount ?? 0 }).map((_, index) => (
                  <button
                    key={index}
                    className={`h-full flex-1 rounded-full transition-all ${
                      index === currentSlideIndex
                        ? "bg-primary shadow-sm"
                        : "bg-white/20 hover:bg-white/40"
                    }`}
                    onClick={() => setCurrentSlideIndex(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

  );
  }
