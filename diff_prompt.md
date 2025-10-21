Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

Was die Diffs tun (kurz):

Neu erzeugter Text wird zentriert und bei ~1/3 der Höhe platziert (TikTok-Style) – gilt sowohl für initial generierte Slides als auch beim “Text +” hinzufügen.

codebase

codebase

Das Hintergrundbild wird beim ersten Laden maximal skaliert, sodass alles sichtbar bleibt (“contain”/best fit).

codebase

Zoom mit Mausrad nur, wenn das Bild aktiv selektiert ist (blaue Box wird angezeigt). Klick auf Text deselektiert das Bild; dann bewirkt Scrollen nichts.

codebase

🧩 Diff
**_ Begin Patch
_** Update File: src/canvas/commands.ts
@@
export const addText = (c: CanvasDoc, text = "Neuer Text"): CanvasDoc => ({

- ...c,
- nodes: [
- ...c.nodes,
- {
-      id: crypto.randomUUID(),
-      type: "text",
-      x: 100,
-      y: 100,
-      text,
-      fontFamily: "Inter",
-      fontSize: 64,
-      fill: "#111",
-      stroke: "#000",
-      strokeWidth: 0,
-      padding: 8,
-      textBg: null,
-      align: "left",
- } satisfies CanvasTextNode,
- ],
- selection: [],

* ...c,
* nodes: [
* ...c.nodes,
* (() => {
*      const width = Math.round(c.width * 0.7);              // ~70% Breite
*      const x = Math.round((c.width - width) / 2);          // horizontal zentriert
*      const y = Math.round(c.height * (1 / 3));             // ~1/3 von oben
*      return {
*        id: crypto.randomUUID(),
*        type: "text",
*        x,
*        y,
*        text,
*        fontFamily: "Inter",
*        fontSize: 64,
*        fill: "#111",
*        stroke: "#000",
*        strokeWidth: 0,
*        padding: 8,
*        textBg: null,
*        align: "center",
*        width,
*      } satisfies CanvasTextNode;
* })(),
* ],
* selection: [],
  });
  \*\*\* End Patch

**_ Begin Patch
_** Update File: src/components/presentation/utils/parser.ts
@@
export function buildCanvasDocFromSlide(
slide: PlateSlide,
): { canvas: CanvasDoc; position?: { x: number; y: number } } {
@@

- let textPosition: { x: number; y: number } | undefined;

* let textPosition: { x: number; y: number } | undefined;
  if (segments.length > 0) {
  const content = segments.join("\n\n");

- const textWidth = Math.round(width \* 0.7);
- const margin = Math.round(width \* 0.1);
- const alignment =
-      slide.alignment === "end"
-        ? "right"
-        : slide.alignment === "center"
-          ? "center"
-          : "left";
-
- let x = slide.position?.x ?? margin;
- if (!slide.position) {
-      if (alignment === "center") {
-        x = Math.max(margin, Math.round((width - textWidth) / 2));
-      } else if (alignment === "right") {
-        x = Math.max(margin, width - textWidth - margin);
-      }
- }
-
- const y = slide.position?.y ?? Math.round(height \* 0.22);

* const textWidth = Math.round(width \* 0.7);
* // Default: immer mittig (TikTok-Style)
* const alignment = "center";
* // Falls Position noch nicht gesetzt: zentriert platzieren
* const x =
*      slide.position?.x ??
*      Math.max(0, Math.round((width - textWidth) / 2));
* const y = slide.position?.y ?? Math.round(height \* (1 / 3));
  const textColor = chooseTextColor(base.bg);
  base.nodes.push({
  id: `text-${nanoid()}`,
  type: "text",
  x,
  y,
  width: textWidth,
  text: content,
  fontFamily: "Inter",
  fontSize: pickFontSize(content.length),
  align: alignment,
  fill: textColor,
  });
  textPosition = { x, y };
  }
  \*\*\* End Patch

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@
const onBGPointerDown = (e: React.PointerEvent) => {
const target = e.target as HTMLElement;
@@

- // 3) ECHTER Hintergrundklick → Editor schließen + Pan erlauben
- if (isEditingRef.current) {
-      setIsEditing(null);
- }
- isPanning.current = true;

* // 3) ECHTER Hintergrundklick → Editor schließen + Bild selektieren + Pan erlauben
* if (isEditingRef.current) {
*      setIsEditing(null);
* }
* setActiveLayerId(null);
* setBgSelected(true);
* isPanning.current = true;
  lastPoint.current = { x: e.clientX, y: e.clientY };
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  \*\*\* End Patch

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@

- const wheelHandler = useCallback((e: WheelEvent) => {
- if (isEditingRef.current) {
-      // im Editor-Modus kein Pan/Zoom (Seite darf scrollen)
-      return;
- }

* // Nur zoomen, wenn das Bild selektiert ist
* const wheelHandler = useCallback((e: WheelEvent) => {
* if (isEditingRef.current) return;
* if (!bgSelected) return;
  e.preventDefault();
  e.stopPropagation();
  @@
  }, []);
  \*\*\* End Patch

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@

-          {imageUrl ? (
-            <img
-              ref={imgRef}
-              src={imageUrl}
-              alt=""
-              className="absolute left-1/2 top-1/2 select-none pointer-events-none"
-              style={{
-                transform: `translate(-50%,-50%) translate(${offset.x}px, ${offset.y}px) scale(${Math.max(
-                  0.001,
-                  scale,
-                )})`,
-                transformOrigin: "center",
-              }}
-              draggable={false}
-            />
-          ) : (

*          {imageUrl ? (
*            <>
*              <img
*                ref={imgRef}
*                src={imageUrl}
*                alt=""
*                className="absolute left-1/2 top-1/2 select-none pointer-events-none"
*                style={{
*                  transform: `translate(-50%,-50%) translate(${offset.x}px, ${offset.y}px) scale(${Math.max(
*                    0.001,
*                    scale,
*                  )})`,
*                  transformOrigin: "center",
*                }}
*                draggable={false}
*                onLoad={(e) => {
*                  // Beim ersten Laden: Bild so skalieren, dass es KOMPLETT sichtbar ist (contain)
*                  try {
*                    const n = e.currentTarget as HTMLImageElement;
*                    const fit = Math.min(W / n.naturalWidth, H / n.naturalHeight);
*                    setScale((prev) => (prev === 1 ? fit : prev));
*                  } catch {}
*                }}
*              />
*              {bgSelected && (
*                <div
*                  className="absolute left-1/2 top-1/2 pointer-events-none"
*                  style={{
*                    transform: `translate(-50%,-50%) translate(${offset.x}px, ${offset.y}px) scale(${Math.max(
*                      0.001,
*                      scale,
*                    )})`,
*                    transformOrigin: "center",
*                    width: W,
*                    height: H,
*                    boxSizing: "border-box",
*                    border: "2px dashed rgba(59,130,246,0.9)", /* blue-500 */
*                    borderRadius: "8px",
*                  }}
*                />
*              )}
*            </>
*          ) : (
               <div className="absolute inset-0 bg-black" />
             )}
  \*\*\* End Patch

**_ Begin Patch
_** Update File: src/canvas/legacy/SlideCanvasLegacy.tsx
@@

<div
data-role="text-layer"
className={`absolute rounded-lg ${isActive ? "ring-2 ring-blue-500/80" : ""} ${isCurrentEditing ? "ring-2 ring-green-500/90" : ""} shadow-sm`}
style={{
@@
                   }}

-                  onPointerDown={(e) => {

*                  onPointerDown={(e) => {
                     // Im Editor-Modus keine Pointer-Blockade → Mausplatzierung/Markieren funktioniert

-                    if (isCurrentEditing) return;

*                    if (isCurrentEditing) return;
*                    // Klick auf Text → Bild-Selektion aufheben, Scroll-Zoom hat dann KEINE Wirkung
*                    setBgSelected(false);
                       selectLayer(layer.id, e);
                     }}
                     onDoubleClick={() => onDoubleClick(layer.id)}
                   >
  \*\*\* End Patch
