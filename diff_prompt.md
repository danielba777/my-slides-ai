Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

src/components/presentation/canvas/SlideCanvasBase.tsx
@@
const [textPosition, setTextPosition] = useState(
slideWithExtras.position ?? defaultPosition,
);

- useEffect(() => {
- setTextPosition(slideWithExtras.position ?? defaultPosition);
- }, [slideWithExtras.position?.x, slideWithExtras.position?.y, defaultPosition]);

* // Verhindert, dass während Drag-Operationen die Position durch den Default/Effekt überschrieben wird
* const isDraggingTextRef = useRef(false);
*
* useEffect(() => {
* if (isDraggingTextRef.current) return;
* const next = slideWithExtras.position ?? defaultPosition;
* // nur setzen wenn es sich wirklich geändert hat (verhindert Flackern)
* if (next.x !== textPosition.x || next.y !== textPosition.y) {
*      setTextPosition(next);
* }
* }, [
* slideWithExtras.position?.x,
* slideWithExtras.position?.y,
* defaultPosition,
* textPosition.x,
* textPosition.y,
* ]);
  @@
  const textContent = useMemo(() => {
  if (activeTextNode?.text) {
  return activeTextNode.text;
  }
  return extractPlainText(slide.content ?? []);
  }, [activeTextNode?.text, slide.content]);

- const handleDragEnd = useCallback(

* // während des Draggen live die UI-Position updaten (kontrollierte Komponente)
* const handleDragMove = useCallback((event: any) => {
* isDraggingTextRef.current = true;
* const next = { x: event.target.x(), y: event.target.y() };
* // keine Persistierung hier – nur UI-State
* setTextPosition(next);
* }, []);
*
* const handleDragStart = useCallback(() => {
* isDraggingTextRef.current = true;
* }, []);
*
* const handleDragEnd = useCallback(
  (event: any) => {

-      const next = { x: event.target.x(), y: event.target.y() };
-      setTextPosition(next);

*      const next = { x: event.target.x(), y: event.target.y() };
*      // final: UI-State & Persistierung
*      setTextPosition(next);
*      isDraggingTextRef.current = false;
       const { slides, setSlides } = usePresentationState.getState();

-      setSlides(

*      setSlides(
         slides.map((s, index) => {
           if (index !== slideIndex) return s;
           const updatedCanvas = s.canvas
             ? {
                 ...s.canvas,
                 nodes: s.canvas.nodes.map((node) =>

-                  node.type === "text" && node.id === (activeTextNode?.id ?? node.id)
-                    ? { ...node, x: next.x, y: next.y }

*                  // Nur genau den aktiven Text-Knoten persistieren, falls vorhanden
*                  node.type === "text" && activeTextNode?.id && node.id === activeTextNode.id
*                    ? { ...node, x: next.x, y: next.y }
                       : node,
                   ),
                 }
               : s.canvas;
             return {
               ...s,
               position: next,
               canvas: updatedCanvas,
             };
           }),
         );
       },
       [activeTextNode?.id, slideIndex],
  );
  @@
  <Stage
             ref={stageRef}
             width={stageDimensions.width}
             height={stageDimensions.height}
             className="shadow-lg"
           >
  <Layer>
  @@

-            <Text
-              text={textContent}
-              fontSize={32}
-              fontFamily="TikTok Sans, sans-serif"
-              fill="#ffffff"
-              x={textPosition.x}
-              y={textPosition.y}
-              draggable={!disableDrag}
-              onDragEnd={handleDragEnd}
-            />

*            <Text
*              key={`text-${activeTextNode?.id ?? "fallback"}`}
*              text={textContent}
*              fontSize={32}
*              fontFamily="TikTok Sans, sans-serif"
*              fill="#ffffff"
*              x={textPosition.x}
*              y={textPosition.y}
*              draggable={!disableDrag}
*              // kontrolliertes Dragging:
*              onDragStart={handleDragStart}
*              onDragMove={handleDragMove}
*              onDragEnd={handleDragEnd}
*              // verhindert „Wegschnappen“ außerhalb der Bühne
*              dragBoundFunc={(pos) => ({
*                x: Math.min(
*                  Math.max(0, pos.x),
*                  stageDimensions.width - 10
*                ),
*                y: Math.min(
*                  Math.max(0, pos.y),
*                  stageDimensions.height - 10
*                ),
*              })}
*            />
            </Layer>
          </Stage>
        </div>
      </div>
  );
  }
