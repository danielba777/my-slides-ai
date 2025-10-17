Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

Diff 1 — Toolbar von links (absolut) nach unten (horizontal) verschieben

Datei: src/components/presentation/presentation-page/SlideContainer.tsx

codebase

@@

-        {/* Linke, vertikale Toolbar (immer sichtbar, stört nicht den Editor) */}
-        {!isPresenting && !isReadOnly && (
-          <div
-            className={cn(
-              "absolute top-1/2 -translate-y-1/2 -left-14 z-[1001]",
-            )}
-            aria-label="Slide toolbar"
-          >
-            <div className="flex flex-col items-center gap-2">
-              {/* Drag-Handle */}
-              <button
-                ref={setActivatorNodeRef as React.Ref<HTMLButtonElement>}
-                {...listeners}
-                {...attributes}
-                className="flex h-9 w-9 items-center justify-center rounded-md bg-background/95 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground focus:outline-none focus-visible:outline-none"
-                aria-label="Folienposition ziehen"
-                title="Verschieben"
-              >
-                <GripVertical className="h-4 w-4" />
-              </button>
-
-              {/* Slide-Einstellungen */}
-              <div className="rounded-md bg-background/95 shadow-sm backdrop-blur">
-                <SlideEditPopover index={index} />
-              </div>
-
-              {/* Neues Canvas unter aktueller Folie */}
-              <Button
-                variant="ghost"
-                size="icon"
-                className="h-9 w-9 rounded-md bg-background/95 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground focus:outline-none focus-visible:outline-none"
-                onClick={() => addSlide("after", index)}
-                aria-label="Neue Folie darunter"
-                title="Neue Folie darunter"
-              >
-                <Plus className="h-4 w-4" />
-              </Button>
-
-              {/* Löschen */}
-              <AlertDialog>
-                <AlertDialogTrigger asChild>
-                  <Button
-                    variant="ghost"
-                    size="icon"
-                    className="h-9 w-9 rounded-md bg-background/95 text-muted-foreground shadow-sm backdrop-blur hover:text-destructive focus:outline-none focus-visible:outline-none"
-                    aria-label="Folie löschen"
-                    title="Folie löschen"
-                  >
-                    <Trash className="h-4 w-4" />
-                  </Button>
-                </AlertDialogTrigger>
-                <AlertDialogContent>
-                  <AlertDialogHeader>
-                    <AlertDialogTitle>Delete Slide</AlertDialogTitle>
-                    <AlertDialogDescription>
-                      Are you sure you want to delete slide {index + 1}? This action cannot be undone.
-                    </AlertDialogDescription>
-                  </AlertDialogHeader>
-                  <AlertDialogFooter>
-                    <AlertDialogCancel>Cancel</AlertDialogCancel>
-                    <AlertDialogAction asChild>
-                      <Button variant="destructive" onClick={deleteSlide}>
-                        Delete
-                      </Button>
-                    </AlertDialogAction>
-                  </AlertDialogFooter>
-                </AlertDialogContent>
-              </AlertDialog>
-            </div>
-          </div>
-        )}

*        {/* Untere Toolbar: unter dem Canvas, horizontal und mittig */}
*        {!isPresenting && !isReadOnly && null}

-        {children}

*        {children}
*
*        {/* Untere Toolbar unter dem Canvas */}
*        {!isPresenting && !isReadOnly && (
*          <div
*            className={cn(
*              "z-[1001] mt-3 w-full",
*            )}
*            aria-label="Slide toolbar"
*          >
*            <div className="mx-auto flex w-full max-w-[760px] items-center justify-center gap-2 rounded-md bg-background/95 p-2 shadow-sm backdrop-blur">
*              {/* Drag-Handle */}
*              <button
*                ref={setActivatorNodeRef as React.Ref<HTMLButtonElement>}
*                {...listeners}
*                {...attributes}
*                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:outline-none"
*                aria-label="Folienposition ziehen"
*                title="Verschieben"
*              >
*                <GripVertical className="h-4 w-4" />
*              </button>
*
*              {/* Slide-Einstellungen */}
*              <div className="rounded-md">
*                <SlideEditPopover index={index} />
*              </div>
*
*              {/* Neue Folie darunter */}
*              <Button
*                variant="ghost"
*                size="icon"
*                className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
*                onClick={() => addSlide("after", index)}
*                aria-label="Neue Folie darunter"
*                title="Neue Folie darunter"
*              >
*                <Plus className="h-4 w-4" />
*              </Button>
*
*              {/* Löschen */}
*              <AlertDialog>
*                <AlertDialogTrigger asChild>
*                  <Button
*                    variant="ghost"
*                    size="icon"
*                    className="h-9 w-9 rounded-md text-muted-foreground hover:text-destructive"
*                    aria-label="Folie löschen"
*                    title="Folie löschen"
*                  >
*                    <Trash className="h-4 w-4" />
*                  </Button>
*                </AlertDialogTrigger>
*                <AlertDialogContent>
*                  <AlertDialogHeader>
*                    <AlertDialogTitle>Delete Slide</AlertDialogTitle>
*                    <AlertDialogDescription>
*                      Are you sure you want to delete slide {index + 1}? This action cannot be undone.
*                    </AlertDialogDescription>
*                  </AlertDialogHeader>
*                  <AlertDialogFooter>
*                    <AlertDialogCancel>Cancel</AlertDialogCancel>
*                    <AlertDialogAction asChild>
*                      <Button variant="destructive" onClick={deleteSlide}>
*                        Delete
*                      </Button>
*                    </AlertDialogAction>
*                  </AlertDialogFooter>
*                </AlertDialogContent>
*              </AlertDialog>
*            </div>
*          </div>
*        )}
