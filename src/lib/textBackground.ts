// Utilitys zur Erzeugung von Text-Hintergründen (Block/Blob) auf Basis gemessener Zeilen.
// Erwartet Messwerte aus measureWrappedText (lines, lineHeight, widths pro Zeile).

export type BlobInput = {
  lineWidths: number[]; // Breite je sichtbarer Zeile (ohne Padding)
  lineHeight: number; // Zeilenhöhe (px)
  padding: number; // Innenabstand (px)
  radius: number; // Außenradius (px) – nur für außen, nicht für innere „Kerben"
};

/* Liefert die Außenmaße des Block-Rect basierend auf der längsten Zeile */
export function getBlockRectDims(
  lineWidths: number[],
  lineHeight: number,
  padding: number,
) {
  const maxW = Math.max(0, ...lineWidths);
  const h = lineWidths.length * lineHeight;
  return {
    x: -padding,
    y: 0,
    width: maxW + padding * 2,
    height: h,
  };
}

/**
 * - Erzeugt einen zusammenhängenden Blob-Pfad:
 * - - Außen (oben/unten) abgerundet
 * - - Zwischen den Zeilen fließende Übergänge (konkav/konvex) abhängig von der Breitenänderung
 * - - Nur EINE Form, keine einzelnen pill-förmigen Zeilen
 *
 * - Geometrie:
 * - Wir laufen rechts von oben nach unten, verbinden Zeilenbreiten über weiche Quadratic-Beziers
 * - (am Zeilen-„Übergang"; Kontrollpunkt liegt leicht versetzt), unten runden wir ab, laufen links
 * - wieder hoch und schließen am oben links.
 */
export function buildBlobPath({
  lineWidths,
  lineHeight,
  padding,
  radius,
}: BlobInput): string {
  const n = lineWidths.length;
  if (n === 0) return "";

  const right = (i: number) => (lineWidths[i] ?? 0) + padding; // rechte Kante pro Zeile
  const left = () => -padding; // linke Kante ist fix (Text startet bei 0)
  const yTop = (i: number) => i * lineHeight;
  const yBot = (i: number) => (i + 1) * lineHeight;

  const r = Math.max(0, Math.min(radius, lineHeight * 0.5)); // begrenze Radius sinnvoll
  const curveDepth = Math.min(lineHeight * 0.45, Math.max(6, r)); // Tiefe der Übergangs-Bezier

  // Start: oben rechts mit Außenradius
  let d = "";
  // Move zum Startpunkt (oben rechts, nach Radius)
  d += `M ${right(0) - r}, ${yTop(0)} `;
  // Oben rechts Rundung
  d += `Q ${right(0)}, ${yTop(0)} ${right(0)}, ${yTop(0) + r} `;

  // Rechtskante: Zeile für Zeile runter
  for (let i = 0; i < n; i++) {
    // bis unteres Ende der Zeile
    d += `L ${right(i)}, ${yBot(i) - (i === n - 1 ? r : 0)} `;
    if (i < n - 1) {
      // Übergang zu Zeile i+1 (Breitenänderung ausgleichen)
      const curr = right(i);
      const next = right(i + 1);
      const midY = yBot(i); // Übergangs-Y
      const ctrlX = curr + (next - curr) * 0.5; // weicher Übergang
      // leichte „Bucht"/"Bauch" durch vertikale Tiefe:
      d += `Q ${ctrlX}, ${midY + curveDepth * Math.sign(next - curr)} ${next}, ${midY} `;
    }
  }

  // Unten rechts Außenradius
  d += `Q ${right(n - 1)}, ${yBot(n - 1)} ${right(n - 1) - r}, ${yBot(n - 1)} `;

  // Unterkante nach links
  d += `L ${left() + r}, ${yBot(n - 1)} `;
  // Unten links Rundung
  d += `Q ${left()}, ${yBot(n - 1)} ${left()}, ${yBot(n - 1) - r} `;

  // Linke Kante nach oben (glatt, da linke Textkante fix ist)
  d += `L ${left()}, ${yTop(0) + r} `;
  // Oben links Rundung und Schließen
  d += `Q ${left()}, ${yTop(0)} ${left() + r}, ${yTop(0)} Z`;

  return d;
}
