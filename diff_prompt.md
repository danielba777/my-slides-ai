Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

Diff-Files (copy-paste an Claude Code schicken)

Wichtig: Genau so übernehmen, keine weiteren Stellen ändern.

Diff #1 – Nur kurze Texte nutzen (H1-Pass-Through)

File: src/app/api/presentation/generate/route.ts

*** a/src/app/api/presentation/generate/route.ts
--- b/src/app/api/presentation/generate/route.ts
@@
-// TODO: Add table and chart to the available layouts
-const slidesTemplate = `
-You are an expert presentation writer. Your task is to create a clear, text-only presentation in XML format.
-
-## CORE REQUIREMENTS
-
-1. FORMAT: Use <SECTION> tags for each slide.
-2. CONTENT: Expand on the outline topics with cohesive paragraphs of text.
-3. SIMPLICITY: Do NOT use any layout components (BOXES, BULLETS, ICONS, TABLE, CHART, etc.).
-4. TEXT ONLY: Each slide must contain exactly one <H1> heading and one or more <P> paragraphs. No images or visual elements.
-
-## PRESENTATION DETAILS
-...
-Now create a complete XML presentation with {TOTAL_SLIDES} slides using this text-only structure.
-`;
+// TODO: Add table and chart to the available layouts
+const slidesTemplate = `
+You are a formatting assistant. Produce a minimal XML presentation that **passes through** the given outline.
+
+## GOAL
+Create exactly {TOTAL_SLIDES} slides where **each slide contains ONLY one <H1>**.
+The <H1> text MUST be the corresponding outline line (trim leading numbering like "1. " / "2) " / "- ").
+Do **not** expand, paraphrase, add text, or add extra elements.
+
+## FORMAT RULES
+1) Wrap all slides in a single <PRESENTATION> root.
+2) For each outline item create:
+<SECTION>
+    <H1>Exact outline text (numbering removed)</H1>
+</SECTION>
+3) No <P>, no lists, no tables, no charts, no images, no extra attributes.
+4) Keep the original language: {LANGUAGE}. Ignore {TONE} for content; it's pass-through.
+
+## CONTEXT (for indexing only; do NOT add content from here)
+- Title: {TITLE}
+- User Request: {PROMPT}
+- Date: {CURRENT_DATE}
+- Outline Items: {OUTLINE_FORMATTED}
+- Slides: {TOTAL_SLIDES}
+- Research: {SEARCH_RESULTS}
+
+## OUTPUT
+Return ONLY valid XML as shown:
+```xml
+<PRESENTATION>
+<SECTION>
+<H1>Outline item 1 (numbering removed)</H1>
+</SECTION>
+<!-- Repeat for each outline item -->
+</PRESENTATION>
+```
+`;


(Quelle zeigt altes/neues Template und dass jetzt wirklich nur <H1> erzeugt wird.) 

codebase

 

codebase

Diff #2 – Hook-Fehler & Text-Flackern fixen (Hook aus der Map auslagern, Render-Gate bleibt)

File: src/components/presentation/presentation-page/PresentationSlidesView.tsx
(Falls dein File anders heißt: Das ist die Datei mit export const PresentationSlidesView = ({ isGeneratingPresentation }) => { ... items.map(...) }.)

*** a/src/components/presentation/presentation-page/PresentationSlidesView.tsx
--- b/src/components/presentation/presentation-page/PresentationSlidesView.tsx
@@
-import React from "react";
+import React, { memo } from "react";
@@
-// ❌ useImageReady wurde direkt in items.map(...) verwendet (Hook in Loop)
-// -> Das führt zu "Rendered fewer hooks than expected"
-function useImageReady(url?: string) {
+// Hilfs-Hook: Bild vorab decodieren (verhindert halb-gerenderte Frames)
+function useImageReady(url?: string) {
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
     img.src = url;
     if (typeof (img as any).decode === "function") {
       (img as any).decode().then(markReady).catch(markReady);
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
 
+// ✅ Child-Komponente, damit der Hook NICHT in einer Schleife aufgerufen wird
+const SlideFrame = memo(function SlideFrame({ slide, index, isPresenting, slidesCount }: {
+  slide: any; index: number; isPresenting: boolean; slidesCount: number;
+}) {
+  const safeCanvas: CanvasDoc =
+    (slide.canvas as CanvasDoc | undefined) ?? {
+      width: DEFAULT_CANVAS.width,
+      height: DEFAULT_CANVAS.height,
+      bg: DEFAULT_CANVAS.bg,
+      nodes: [],
+      selection: [],
+    };
+  const imgUrl = slide.rootImage?.url as string | undefined;
+  const imageReady = useImageReady(imgUrl);
+  return (
+    <SortableSlide id={slide.id} key={slide.id}>
+      <div className={cn(`slide-wrapper slide-wrapper-${index} flex-shrink-0`, !isPresenting && "max-w-full")}>
+        <SlideContainer index={index} id={slide.id} slideWidth={undefined} slidesCount={slidesCount}>
+          <div className={cn(`slide-container-${index}`, isPresenting && "h-screen w-screen")}>
+            {imageReady ? (
+              <SlideCanvas
+                doc={safeCanvas}
+                onChange={(next: CanvasDoc) => {
+                  const { slides, setSlides } = usePresentationState.getState();
+                  const updated = slides.slice();
+                  const i = updated.findIndex((x) => x.id === slide.id);
+                  if (i < 0) return;
+                  const current = updated[i];
+                  if (!current) return;
+                  // Nur setzen, wenn sich was geändert hat (verhindert Re-Mount-Bursts)
+                  if (current.canvas !== next) {
+                    updated[i] = { ...current, canvas: next };
+                    setSlides(updated);
+                  }
+                }}
+              />
+            ) : (
+              // Stabiler Placeholder verhindert Schwarz-Frames & Text-Flackern
+              <div
+                className={cn(
+                  "rounded-xl",
+                  isPresenting ? "h-screen w-screen" : "h-[700px] w-[420px]",
+                  "bg-black/90"
+                )}
+              />
+            )}
+          </div>
+        </SlideContainer>
+      </div>
+    </SortableSlide>
+  );
+});
+
 export const PresentationSlidesView = ({ isGeneratingPresentation }: PresentationSlidesViewProps) => {
@@
-  {items.map((slide, index) => {
-    const safeCanvas: CanvasDoc = (slide.canvas as CanvasDoc | undefined) ?? { ... };
-    const imgUrl = slide.rootImage?.url;
-    const imageReady = useImageReady(imgUrl);
-    return (
-      <SortableSlide id={slide.id} key={slide.id}>
-        ...
-        {imageReady ? (<SlideCanvas ... />) : (<div className="bg-black/90" />)}
-        ...
-      </SortableSlide>
-    );
-  })}
+  {items.map((slide, index) => (
+    <SlideFrame
+      key={slide.id}
+      slide={slide}
+      index={index}
+      isPresenting={isPresenting}
+      slidesCount={items.length}
+    />
+  ))}


Damit:

Kein Hook mehr in der Schleife → Fehler weg.

Canvas/Text wird erst gemountet, wenn das Bild decodiert wurde → kein Flackern.
(Die betroffenen Stellen waren zuvor genau hier.) 

codebase

 

codebase

Diff #3 – „Generieren“-Flow: Button bleibt „loading“, Zielseite startet zuverlässig

A. Dashboard: Cookie setzen vor Push
File: src/components/presentation/dashboard/PresentationDashboard.tsx

*** a/src/components/presentation/dashboard/PresentationDashboard.tsx
--- b/src/components/presentation/dashboard/PresentationDashboard.tsx
@@
   const handleGenerate = async () => {
     if (!presentationInput.trim()) {
       toast.error("Please enter a topic for your presentation");
       return;
     }
 
     // Set UI loading state
     setIsGeneratingOutline(true);
 
     try {
       const result = await createEmptyPresentation(
         presentationInput.substring(0, 50) || "Untitled Presentation",
         theme,
         language,
       );
 
       if (result.success && result.presentation) {
+        // Setze Pending-Cookie, sodass die Zielseite sofort loslegt
+        try {
+          const domain =
+            typeof window !== "undefined" && window.location.hostname === "localhost"
+              ? "localhost"
+              : ".allweone.com";
+          document.cookie =
+            `presentation_generation_pending=true; path=/; SameSite=Lax;` +
+            (domain !== "localhost" ? ` domain=${domain};` : "");
+        } catch {}
         // Set the current presentation
         setCurrentPresentation(
           result.presentation.id,
           result.presentation.title,
         );
         router.push(
           `/dashboard/slideshows/generate/${result.presentation.id}`,
         );
       } else {
         setIsGeneratingOutline(false);
         toast.error(result.message || "Failed to create presentation");
       }
     } catch (error) {
       setIsGeneratingOutline(false);
       console.error("Error creating presentation:", error);
       toast.error("Failed to create presentation");
     }
   };


(Die Datei enthält bereits Loading-Variant & Disable-State; wir ergänzen nur das Cookie.) 

codebase

B. Generate-Seite: Cookie lesen → Start sofort triggern; anschließend Cookie löschen
File: src/app/dashboard/slideshows/generate/[id]/page.tsx

*** a/src/app/dashboard/slideshows/generate/[id]/page.tsx
--- b/src/app/dashboard/slideshows/generate/[id]/page.tsx
@@
 export const PRESENTATION_GENERATION_COOKIE = "presentation_generation_pending";
 
+function hasPendingCookie() {
+  if (typeof document === "undefined") return false;
+  return document.cookie.split(";").some((c) => c.trim().startsWith(`${PRESENTATION_GENERATION_COOKIE}=`));
+}
+
+function clearPendingCookie() {
+  if (typeof document === "undefined") return;
+  const domain =
+    window.location.hostname === "localhost" ? "localhost" : ".allweone.com";
+  document.cookie = `${PRESENTATION_GENERATION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; ${
+    domain !== "localhost" ? `domain=${domain}; ` : ""
+  }SameSite=Lax`;
+}
+
@@
-  // Clear the cookie when the page loads
-  useEffect(() => {
-    clearPresentationCookie();
-  }, []);
+  // Clear legacy cookie name if vorhanden (Abwärtskompatibilität)
+  useEffect(() => {
+    // früherer Name beibehalten:
+    clearPresentationCookie();
+  }, []);
 
   // This effect handles the immediate startup of generation upon first mount
   // only if we're coming fresh from the dashboard (isGeneratingOutline === true)
   useEffect(() => {
     // Only run once on initial page load
     if (initialLoadComplete.current) return;
     initialLoadComplete.current = true;
 
-    // If isGeneratingOutline is true but generation hasn't been started yet,
-    // this indicates we just came from the dashboard and should start generation
-    if (isGeneratingOutline && !generationStarted.current) {
+    // Start, wenn Store-Flag ODER Pending-Cookie gesetzt ist
+    if ((isGeneratingOutline || hasPendingCookie()) && !generationStarted.current) {
       console.log("Starting outline generation after navigation");
       generationStarted.current = true;
 
       // Give the component time to fully mount and establish connections
       // before starting the generation process
       setTimeout(() => {
         setShouldStartOutlineGeneration(true);
+        // Cookie ist verbraucht
+        clearPendingCookie();
       }, 100);
     }
-  }, [isGeneratingOutline, setShouldStartOutlineGeneration]);
+  }, [isGeneratingOutline, setShouldStartOutlineGeneration]);


(Damit bleibt der Button „loading“, und die Zielseite startet immer zuverlässig – selbst wenn der Zustand beim Routen verloren ginge.) 

codebase

Ergebnis

Kein Hook-Runtime-Error mehr & kein Text-Flackern (Bilder + Texte bleiben stabil).

„Generieren“ bleibt im Loading-State, bis die Generate-Seite übernommen hat; sofortige Weiterleitung ohne zweiten Klick.

Slides enthalten nur die kurzen H1-Titel aus der Outline, wie gewünscht.