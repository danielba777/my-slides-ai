// apps/dashboard/src/lib/textMetrics.ts

const BASE_FONT_PX = 72;
const PADDING = 8;

export interface TextMeasureOptions {
  text: string;
  fontFamily: string;
  fontWeight: number | string;
  fontStyle: string;
  fontSizePx: number;
  lineHeightPx: number;
  maxWidthPx: number;
  letterSpacingPx: number;
  whiteSpaceMode: "pre-wrap";
  wordBreakMode: "normal";
  paddingPx: number;
}

export interface TextMeasureResult {
  lines: string[];
  contentHeight: number;
  totalHeight: number;
}

/**
 * Gemeinsame Text-Messroutine für Preview und Export.
 * Liefert konsistente Zeilenumbrüche und Höhen.
 */
export function measureWrappedText(
  options: TextMeasureOptions,
): TextMeasureResult {
  const {
    text,
    fontFamily,
    fontWeight,
    fontStyle,
    fontSizePx,
    lineHeightPx,
    maxWidthPx,
    letterSpacingPx,
    whiteSpaceMode,
    wordBreakMode,
    paddingPx,
  } = options;

  if (typeof document === "undefined") {
    // Fallback für SSR
    const fallbackLines = text.split("\n");
    const contentHeight = fallbackLines.length * lineHeightPx;
    return {
      lines: fallbackLines,
      contentHeight,
      totalHeight: Math.ceil(contentHeight + 2 * paddingPx),
    };
  }

  // DOM-Mess-Container erstellen (entsprechend der Preview-Logik)
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-100000px";
  container.style.top = "-100000px";
  container.style.visibility = "hidden";
  container.style.pointerEvents = "none";
  container.style.boxSizing = "content-box";

  const contentWidth = Math.max(0, maxWidthPx - 2 * paddingPx);
  container.style.width = `${contentWidth}px`;
  container.style.whiteSpace = whiteSpaceMode;
  container.style.wordBreak = wordBreakMode;
  container.style.overflowWrap = "normal";
  container.style.fontFamily = fontFamily;
  container.style.fontWeight = String(fontWeight);
  container.style.fontStyle = fontStyle;
  container.style.fontSize = `${fontSizePx}px`;
  container.style.lineHeight = String(lineHeightPx / fontSizePx);
  container.style.letterSpacing = `${letterSpacingPx}px`;
  (container.style as any).fontKerning = "normal";

  // Text in Spans aufteilen für genaue Zeilenmessung
  const paragraphs = text.split("\n");
  const spans: HTMLSpanElement[] = [];

  for (let p = 0; p < paragraphs.length; p++) {
    const words = paragraphs[p].length ? paragraphs[p].split(/\s+/) : [""];
    for (let i = 0; i < words.length; i++) {
      const span = document.createElement("span");
      span.textContent = words[i];
      container.appendChild(span);
      spans.push(span);
      if (i < words.length - 1) {
        container.appendChild(document.createTextNode(" "));
      }
    }
    if (p < paragraphs.length - 1) {
      container.appendChild(document.createElement("br"));
    }
  }

  document.body.appendChild(container);

  // Zeilen basierend auf offsetTop gruppieren
  const lines: string[] = [];
  if (spans.length === 0) {
    lines.push("");
  } else {
    let currentTop = spans[0].offsetTop;
    let bucket: string[] = [spans[0].textContent || ""];

    for (let i = 1; i < spans.length; i++) {
      const s = spans[i];
      const top = s.offsetTop;
      if (top > currentTop) {
        lines.push(bucket.join(" ").trimEnd());
        bucket = [s.textContent || ""];
        currentTop = top;
      } else {
        bucket.push(s.textContent || "");
      }
    }
    lines.push(bucket.join(" ").trimEnd());
  }

  // Container aufräumen
  try {
    document.body.removeChild(container);
  } catch {}

  // Höhen berechnen
  const contentHeight = lines.length * lineHeightPx;
  const totalHeight = Math.ceil(contentHeight + 2 * paddingPx);

  return {
    lines,
    contentHeight,
    totalHeight,
  };
}

/**
 * Automatische Höhe für Textelement berechnen.
 * Wird von Preview und Export gleichermaßen genutzt.
 */
export function computeAutoHeight(
  options: Omit<TextMeasureOptions, "paddingPx"> & {
    width: number;
    paddingPx?: number;
  },
): number {
  const result = measureWrappedText({
    ...options,
    maxWidthPx: options.width,
    paddingPx: options.paddingPx ?? PADDING,
  });

  return Math.max(28, result.totalHeight);
}

/**
 * Prüft ob die aktuelle Höhe für den Text ausreicht.
 */
export function needsHeightAdjustment(
  options: TextMeasureOptions & { currentHeight: number },
): boolean {
  const { totalHeight } = measureWrappedText(options);
  return options.currentHeight < totalHeight;
}
