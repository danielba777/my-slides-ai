Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

1. Hintergrund-Box wirklich einschalten (gleiche Logik wie Preview)

Im Export wird die Box nur gezeichnet, wenn background.enabled === true. In der Preview reicht es, wenn die Opazität > 0 ist. Passe das so an:

Ändern (Export-Code – SlideCanvasLegacy.tsx):
Suche die hasBackground Berechnung und ersetze sie:

// ALT
const hasBackground =
!!bgConfig?.enabled && lineWidths.some((w) => w > 0);

// NEU (wie in der Preview)
const bgEnabled =
(bgConfig?.enabled ?? false) || ((bgConfig?.opacity ?? 0) > 0);
const hasBackground = bgEnabled && lineWidths.some((w) => w > 0);

Stelle im selben Block sicher, dass padX/padY/radius/fill/... unverändert bleiben. Die Stelle findest du hier (Bereich mit rectX/rectY/rectWidth/rectHeight):

codebase

2. Radius der Blob-Box wie die Preview clampen

Die Preview clamped für „Blob“ so: max(bgRadius, min(bgRadius\*1.5, 1600)). Im Export wurde stattdessen rectHeight/2 verwendet – dadurch weicht die Form ab. Ersetze die effectiveRadius-Logik:

// ALT
const effectiveRadius =
bgConfig?.mode === "blob"
? Math.max(radius, rectHeight / 2)
: radius;

// NEU – exakt wie Preview
const effectiveRadius =
bgConfig?.mode === "blob"
? Math.max(radius, Math.min(radius \* 1.5, 1600))
: radius;

Das ist in derselben Box-Zeichenroutine (Export) wie oben. (Zur Kontrolle: In der Preview wird der Radius genau so berechnet, siehe borderRadius in der Text-Box.)

codebase

codebase

3. Kontur-Dicke an die Skalierung koppeln (sonst zu dünn im Export)

Die Preview skaliert den Outline-Ring mit outlineWidth \* layer.scale. Im Export wird die Stroke-Breite aktuell ohne Scale gesetzt und wirkt dadurch dünner. Korrigiere die Zeile im Offscreen-Stroke:

// ALT
ox.lineWidth = 2 \* outlineWidth;

// NEU – paritätisch zur Preview (Text-Shadow-Ring):
ox.lineWidth = 2 _ outlineWidth _ Math.max(0.001, layer.scale);
