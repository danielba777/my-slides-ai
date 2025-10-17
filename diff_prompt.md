Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

Diff: src/components/presentation/presentation-page/PresentationSlidesView.tsx
\*\*\* a/src/components/presentation/presentation-page/PresentationSlidesView.tsx
--- b/src/components/presentation/presentation-page/PresentationSlidesView.tsx
@@
const SlideCanvas = dynamic(() => import("@/canvas/SlideCanvasAdapter"), {
ssr: false,
});

// -- Small utility to wait for root image decode before mounting the canvas --
function useImageReady(url?: string) {
const [ready, setReady] = React.useState(!url);
React.useEffect(() => {
let active = true;
if (!url) {
setReady(true);
return;
}
const img = new Image();
img.crossOrigin = "anonymous";
const markReady = () => active && setReady(true);
// Prefer decode() to avoid showing half-rendered frames (Chrome/Firefox)
img.src = url;
if (typeof (img as any).decode === "function") {
(img as any)
.decode()
.then(markReady)
.catch(markReady);
} else {
img.onload = markReady;
img.onerror = markReady;
}
return () => {
active = false;
};
}, [url]);
return ready;
}

+// Child-Komponente, damit Hooks nicht in einer Schleife aufgerufen werden
+function SlideFrame({

- slide,
- index,
- itemsLength,
- isPresenting,
  +}: {
- slide: any;
- index: number;
- itemsLength: number;
- isPresenting: boolean;
  +}) {
- const safeCanvas: CanvasDoc =
- (slide.canvas as CanvasDoc | undefined) ?? {
-      width: DEFAULT_CANVAS.width,
-      height: DEFAULT_CANVAS.height,
-      bg: DEFAULT_CANVAS.bg,
-      nodes: [],
-      selection: [],
- };
- const imgUrl = slide.rootImage?.url as string | undefined;
- const imageReady = useImageReady(imgUrl);
-
- return (
- <SortableSlide id={slide.id} key={slide.id}>
-      <div
-        className={cn(
-          `slide-wrapper slide-wrapper-${index} flex-shrink-0`,
-          !isPresenting && "max-w-full",
-        )}
-      >
-        <SlideContainer
-          index={index}
-          id={slide.id}
-          slideWidth={undefined}
-          slidesCount={itemsLength}
-        >
-          <div
-            className={cn(
-              `slide-container-${index}`,
-              isPresenting && "h-screen w-screen",
-            )}
-          >
-            {imageReady ? (
-              <SlideCanvas
-                doc={safeCanvas}
-                onChange={(next: CanvasDoc) => {
-                  const { slides, setSlides } = usePresentationState.getState();
-                  const updated = slides.slice();
-                  const indexToUpdate = updated.findIndex((x) => x.id === slide.id);
-                  if (indexToUpdate < 0) return;
-                  const current = updated[indexToUpdate];
-                  if (!current) return;
-                  if (current.canvas !== next) {
-                    updated[indexToUpdate] = { ...current, canvas: next };
-                    setSlides(updated);
-                  }
-                }}
-              />
-            ) : (
-              // Placeholder hält den Platz und verhindert Schwarz-Blitzen
-              <div
-                className={cn(
-                  "rounded-xl",
-                  isPresenting ? "h-screen w-screen" : "h-[700px] w-[420px]",
-                  "bg-black/90",
-                )}
-              />
-            )}
-          </div>
-        </SlideContainer>
-      </div>
- </SortableSlide>
- );
  +}
- interface PresentationSlidesViewProps {
  isGeneratingPresentation: boolean;
  }
  export const PresentationSlidesView = ({
  isGeneratingPresentation,
  }: PresentationSlidesViewProps) => {
  @@

*          {items.map((slide, index) => {
*            const safeCanvas: CanvasDoc =
*              (slide.canvas as CanvasDoc | undefined) ?? {
*                width: DEFAULT_CANVAS.width,
*                height: DEFAULT_CANVAS.height,
*                bg: DEFAULT_CANVAS.bg,
*                nodes: [],
*                selection: [],
*              };
*            const imgUrl = slide.rootImage?.url;
*            const imageReady = useImageReady(imgUrl);
*            return (
*              <SortableSlide id={slide.id} key={slide.id}>
*                <div
*                  className={cn(
*                    `slide-wrapper slide-wrapper-${index} flex-shrink-0`,
*                    !isPresenting && "max-w-full",
*                  )}
*                >
*                  <SlideContainer
*                    index={index}
*                    id={slide.id}
*                    slideWidth={undefined}
*                    slidesCount={items.length}
*                  >
*                    <div
*                      className={cn(
*                        `slide-container-${index}`,
*                        isPresenting && "h-screen w-screen",
*                      )}
*                    >
*                      {imageReady ? (
*                        <SlideCanvas
*                          doc={safeCanvas}
*                          onChange={(next: CanvasDoc) => {
*                            const { slides, setSlides } =
*                              usePresentationState.getState();
*                            const updated = slides.slice();
*                            const indexToUpdate = updated.findIndex(
*                              (x) => x.id === slide.id,
*                            );
*                            if (indexToUpdate < 0) return;
*                            const current = updated[indexToUpdate];
*                            if (!current) return;
*                            // Nur aktualisieren, wenn sich wirklich etwas ändert
*                            if (current.canvas !== next) {
*                              updated[indexToUpdate] = { ...current, canvas: next };
*                              setSlides(updated);
*                            }
*                          }}
*                        />
*                      ) : (
*                        // Placeholder hält den Platz und verhindert Schwarz-Blitzen
*                        <div
*                          className={cn(
*                            "rounded-xl",
*                            isPresenting ? "h-screen w-screen" : "h-[700px] w-[420px]",
*                            "bg-black/90"
*                          )}
*                        />
*                      )}
*                    </div>
*                  </SlideContainer>
*                </div>
*              </SortableSlide>
*            );
*          })}

-          {items.map((slide, index) => (
-            <SlideFrame
-              key={slide.id}
-              slide={slide}
-              index={index}
-              itemsLength={items.length}
-              isPresenting={isPresenting}
-            />
-          ))}
