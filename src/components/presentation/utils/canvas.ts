import { DEFAULT_CANVAS, type CanvasDoc } from "@/canvas/types";
import { nanoid } from "nanoid";
import type { PlateNode, PlateSlide } from "./parser";

const CANVAS_WIDTH = DEFAULT_CANVAS.width;
const CANVAS_HEIGHT = DEFAULT_CANVAS.height;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const resolveX = (nx: number, width: number) =>
  Math.round(clamp01(nx) * width);
const resolveY = (ny: number, height: number) =>
  Math.round(clamp01(ny) * height);

function collectTextSegments(nodes?: PlateNode[]): string[] {
  if (!Array.isArray(nodes)) return [];
  const segments: string[] = [];

  const visit = (node: any, bucket: string[]): void => {
    if (!node || typeof node !== "object") return;
    if (typeof node.text === "string" && node.text.trim()) {
      bucket.push(node.text.trim());
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        visit(child, bucket);
      }
    }
  };

  for (const node of nodes) {
    const bucket: string[] = [];
    visit(node, bucket);
    const merged = bucket.join(" ").replace(/\s+/g, " ").trim();
    if (merged) segments.push(merged);
  }

  return segments;
}

function chooseTextColor(background?: string | null): string {
  if (!background) return "#111827";
  const hex = background.replace("#", "").trim();
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex.padEnd(6, "0").slice(0, 6);
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return "#111827";
  }
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 140 ? "#f9fafb" : "#111827";
}

function pickFontSize(charCount: number): number {
  if (charCount > 360) return 42;
  if (charCount > 220) return 54;
  return 72;
}

export function applyBackgroundImageToCanvas(
  canvas: CanvasDoc | null | undefined,
  imageUrl?: string | null,
  gridImages?: Array<{ url?: string }> | null,
): CanvasDoc {
  // Starte IMMER vom bestehenden Canvas und erhalte ALLE Nicht-Image-Nodes
  const base: CanvasDoc = {
    version: canvas?.version ?? 1,
    width: canvas?.width ?? CANVAS_WIDTH,
    height: canvas?.height ?? CANVAS_HEIGHT,
    bg: canvas?.bg ?? DEFAULT_CANVAS.bg,
    nodes: Array.isArray(canvas?.nodes) ? [...canvas!.nodes] : [],
    selection: Array.isArray(canvas?.selection)
      ? [...(canvas!.selection as any[])]
      : [],
    previewDataUrl: canvas?.previewDataUrl,
  };

  // Remove all existing background images (including grid images)
  const withoutBg = base.nodes.filter(
    (n: any) =>
      !(
        n?.type === "image" &&
        (n?.id === "canvas-background-image" ||
          n?.id?.startsWith("canvas-grid-image-"))
      ),
  );

  // Handle grid layout
  if (gridImages && Array.isArray(gridImages) && gridImages.length > 0) {
    const gridNodes: any[] = [];
    // Berechne exakte Zellgrößen für 2x2 Grid
    // WICHTIG: Alle Zellen MÜSSEN exakt gleich groß sein
    const cellWidth = base.width / 2;
    const cellHeight = base.height / 2;

    // Grid-Layout: 4 Zellen in 2x2 Anordnung
    // Zelle 0: Oben Links
    // Zelle 1: Oben Rechts
    // Zelle 2: Unten Links
    // Zelle 3: Unten Rechts

    const positions = [
      { x: 0, y: 0, width: cellWidth, height: cellHeight }, // Oben Links
      { x: cellWidth, y: 0, width: cellWidth, height: cellHeight }, // Oben Rechts
      { x: 0, y: cellHeight, width: cellWidth, height: cellHeight }, // Unten Links
      { x: cellWidth, y: cellHeight, width: cellWidth, height: cellHeight }, // Unten Rechts
    ];

    for (let i = 0; i < 4; i++) {
      const img = gridImages[i];
      if (img?.url) {
        gridNodes.push({
          id: `canvas-grid-image-${i}`,
          type: "image" as const,
          ...positions[i],
          url: img.url,
        });
      }
    }

    return {
      ...base,
      nodes: [...gridNodes, ...withoutBg],
    };
  }

  // Handle single image
  if (!imageUrl) {
    return {
      ...base,
      nodes: withoutBg,
    };
  }

  const imageNode = {
    id: "canvas-background-image",
    type: "image" as const,
    x: 0,
    y: 0,
    width: base.width,
    height: base.height,
    url: imageUrl,
  };

  // Prüfe Idempotenz: existiert bereits der gleiche BG?
  const prevBg = base.nodes.find(
    (n: any) => n?.type === "image" && n?.id === "canvas-background-image",
  ) as any;
  if (prevBg) {
    const sameUrl = prevBg.url === imageNode.url;
    const sameSize =
      prevBg.width === imageNode.width && prevBg.height === imageNode.height;
    if (sameUrl && sameSize) {
      // nichts ändern
      return { ...base, nodes: base.nodes };
    }
  }

  // BG-Image immer als unterstes Element einfügen
  const mergedNodes = [imageNode, ...withoutBg];
  return { ...base, nodes: mergedNodes };
}

export function buildCanvasDocFromSlide(slide: PlateSlide): {
  canvas: CanvasDoc;
  position?: { x: number; y: number };
} {
  const segments = collectTextSegments(slide.content);
  const width = slide.canvas?.width ?? CANVAS_WIDTH;
  const height = slide.canvas?.height ?? CANVAS_HEIGHT;
  const base: CanvasDoc = {
    version: slide.canvas?.version ?? 1,
    width,
    height,
    bg: slide.bgColor ?? slide.canvas?.bg ?? DEFAULT_CANVAS.bg,
    nodes: [],
    selection: [],
    previewDataUrl: slide.canvas?.previewDataUrl,
  };

  // 🔒 WICHTIG: Wenn bereits ein Canvas mit Nodes existiert, NIEMALS neu aufbauen.
  // Das verhindert, dass Text/Elemente beim Rendern "zurückspringen".
  // ABER: Wir müssen alte "kombinierte" Text-Nodes in separate Nodes aufsplitten
  if (Array.isArray(slide.canvas?.nodes) && slide.canvas!.nodes.length > 0) {
    const hasMultiLineTextNode = slide.canvas.nodes.some((node) => {
      if (node.type !== "text") return false;
      const text = (node as any).text || (node as any).content || "";
      // Prüfe ob es ein Multi-Line Text mit Bullets ist
      return text.includes("\n") && (text.includes("•") || text.includes("-"));
    });

    // Wenn ein Multi-Line Text-Node gefunden wurde, splitte ihn auf
    if (hasMultiLineTextNode) {
      console.log(
        "🔄 Migration: Splitting multi-line text node into separate elements",
      );
      const newNodes: any[] = [];
      let hasProcessedMultiLine = false;

      slide.canvas.nodes.forEach((node) => {
        if (node.type !== "text") {
          newNodes.push(node);
          return;
        }

        const textNode = node as any;
        const text = textNode.text || textNode.content || "";

        // Prüfe ob dies ein Multi-Line Node mit Bullets ist
        if (
          text.includes("\n") &&
          (text.includes("•") || text.includes("-")) &&
          !hasProcessedMultiLine
        ) {
          hasProcessedMultiLine = true;

          // Splitte in Zeilen
          const lines = text
            .split("\n")
            .map((l: string) => l.trim())
            .filter(Boolean);

          // Erkenne Titel und Bullets
          const hasTitle =
            lines.length > 0 &&
            !lines[0]?.startsWith("•") &&
            !lines[0]?.startsWith("-");
          const title = hasTitle ? lines[0] : null;
          const bulletPoints = hasTitle ? lines.slice(1) : lines;

          const baseNx = textNode.nx ?? 0.5;
          const textColor = textNode.fill || chooseTextColor(base.bg);
          const textWidth = textNode.width ?? Math.round(width * 0.7);

          // Erstelle Titel-Node
          if (title) {
            newNodes.push({
              id: `text-title-${nanoid()}`,
              type: "text",
              x: resolveX(baseNx, width),
              y: resolveY(0.25, height),
              nx: baseNx,
              ny: 0.25,
              width: textWidth,
              text: title,
              fontFamily: textNode.fontFamily || "Inter",
              fontSize: (textNode.fontSize || 72) + 10,
              align: "center",
              fill: textColor,
            });
          }

          // Erstelle separate Bullet-Nodes
          if (bulletPoints.length > 0) {
            const startY = title ? 0.4 : 0.3;
            const bulletSpacing = 0.08;

            bulletPoints.forEach((bullet: string, index: number) => {
              const bulletY = startY + index * bulletSpacing;

              newNodes.push({
                id: `text-bullet-${index}-${nanoid()}`,
                type: "text",
                x: resolveX(baseNx, width),
                y: resolveY(bulletY, height),
                nx: baseNx,
                ny: bulletY,
                width: textWidth,
                text: bullet,
                fontFamily: textNode.fontFamily || "Inter",
                fontSize: 50,
                align: "left",
                fill: textColor,
              });
            });
          }
        } else {
          // Behalte andere Text-Nodes unverändert
          newNodes.push(node);
        }
      });

      const updatedCanvas = {
        ...slide.canvas,
        nodes: newNodes,
      };

      const withBg = applyBackgroundImageToCanvas(
        updatedCanvas,
        slide.rootImage?.useGrid ? null : slide.rootImage?.url,
        slide.rootImage?.useGrid ? slide.rootImage.gridImages : null,
      );
      return { canvas: withBg, position: slide.position };
    }

    const withBg = applyBackgroundImageToCanvas(
      slide.canvas,
      slide.rootImage?.useGrid ? null : slide.rootImage?.url,
      slide.rootImage?.useGrid ? slide.rootImage.gridImages : null,
    );
    return { canvas: withBg, position: slide.position };
  }

  let textPosition: { x: number; y: number } | undefined;
  if (segments.length > 0) {
    const content = segments.join("\n\n");

    // Versuche, den Content in Titel und Bullet Points zu splitten
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Erkenne: Erste Zeile = Titel, Rest = Bullet Points
    const hasTitle =
      lines.length > 0 &&
      !lines[0]?.startsWith("•") &&
      !lines[0]?.startsWith("-");
    const title = hasTitle ? lines[0] : null;
    const bulletPoints = hasTitle ? lines.slice(1) : lines;

    const textWidth = Math.round(width * 0.7);
    const alignment = "center";
    const textColor = chooseTextColor(base.bg);

    // Falls Position noch nicht gesetzt: zentriert platzieren (normalisierte Koordinaten 0-1)
    const baseNx = slide.position?.x != null ? slide.position.x / width : 0.5;
    const baseNy = slide.position?.y != null ? slide.position.y / height : 0.5;

    if (title) {
      // Titel-Node (größer, oben)
      base.nodes.push({
        id: `text-title-${nanoid()}`,
        type: "text",
        x: resolveX(baseNx, width),
        y: resolveY(0.25, height),
        nx: baseNx,
        ny: 0.25, // Weiter oben positionieren
        width: textWidth,
        text: title,
        fontFamily: "Inter",
        fontSize: pickFontSize(title.length) + 10, // Etwas größer für Titel
        align: alignment,
        fill: textColor,
      });

      textPosition = {
        x: Math.round(baseNx * width),
        y: Math.round(0.25 * height),
      };
    }

    if (bulletPoints.length > 0) {
      // Erstelle für jeden Bullet Point ein eigenes Text-Element
      const startY = title ? 0.4 : 0.3; // Start-Y-Position
      const bulletSpacing = 0.08; // Abstand zwischen Bullets (8% der Höhe)
      const bulletFontSize = 50; // Kleinere Schriftgröße für Bullets

      bulletPoints.forEach((bullet, index) => {
        const bulletY = startY + index * bulletSpacing;

        base.nodes.push({
          id: `text-bullet-${index}-${nanoid()}`,
          type: "text",
          x: resolveX(baseNx, width),
          y: resolveY(bulletY, height),
          nx: baseNx,
          ny: bulletY,
          width: textWidth,
          text: bullet,
          fontFamily: "Inter",
          fontSize: bulletFontSize,
          align: "left", // Linksbündig für Bullet Points
          fill: textColor,
        });
      });

      if (!textPosition) {
        textPosition = {
          x: Math.round(baseNx * width),
          y: Math.round(startY * height),
        };
      }
    }

    // Fallback: Wenn keine Struktur erkannt wurde, verwende den gesamten Content
    if (base.nodes.length === 0) {
      base.nodes.push({
        id: `text-${nanoid()}`,
        type: "text",
        x: resolveX(baseNx, width),
        y: resolveY(baseNy, height),
        nx: baseNx,
        ny: baseNy,
        width: textWidth,
        text: content,
        fontFamily: "Inter",
        fontSize: pickFontSize(content.length),
        align: alignment,
        fill: textColor,
      });
      textPosition = {
        x: Math.round(baseNx * width),
        y: Math.round(baseNy * height),
      };
    }
  }

  const canvas = applyBackgroundImageToCanvas(
    base,
    slide.rootImage?.useGrid ? null : slide.rootImage?.url,
    slide.rootImage?.useGrid ? slide.rootImage.gridImages : null,
  );
  return { canvas, position: textPosition };
}

export function ensureSlideCanvas(slide: PlateSlide): PlateSlide {
  // 🔧 FIX: Korrigiere falsche Canvas-Größen (z.B. 1920 statt 1620)
  if (slide.canvas) {
    const correctHeight = CANVAS_HEIGHT; // 1620 für 2:3 Format
    if (slide.canvas.height !== correctHeight) {
      console.warn(
        `⚠️ Korrigiere Canvas-Höhe von ${slide.canvas.height} auf ${correctHeight}`,
      );
      slide = {
        ...slide,
        canvas: {
          ...slide.canvas,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
        },
      };
    }
  }

  const nodes = slide.canvas?.nodes ?? [];
  const hasTextNode = nodes.some((node) => {
    if (node.type !== "text") return false;
    const raw = (node as any).text ?? (node as any).content ?? "";
    return typeof raw === "string" && raw.trim().length > 0;
  });
  const hasImageNode = nodes.some(
    (node) => node.type === "image" && typeof (node as any).url === "string",
  );

  if (!hasTextNode) {
    const { canvas, position } = buildCanvasDocFromSlide(slide);
    return {
      ...slide,
      canvas,
      position: slide.position ?? position,
    };
  }

  // MIGRATION: Splitte Multi-Line Text-Nodes mit Bullets in separate Nodes
  const hasMultiLineTextNode = nodes.some((node) => {
    if (node.type !== "text") return false;
    const text = (node as any).text || (node as any).content || "";
    return text.includes("\n") && (text.includes("•") || text.includes("-"));
  });

  if (hasMultiLineTextNode && slide.canvas?.nodes) {
    console.log(
      "🔄 ensureSlideCanvas Migration: Splitting multi-line text nodes",
    );
    const width = slide.canvas.width ?? CANVAS_WIDTH;
    const height = slide.canvas.height ?? CANVAS_HEIGHT;
    const newNodes: any[] = [];
    let hasProcessedMultiLine = false;

    slide.canvas.nodes.forEach((node) => {
      if (node.type !== "text") {
        newNodes.push(node);
        return;
      }

      const textNode = node as any;
      const text = textNode.text || textNode.content || "";

      // Prüfe ob dies ein Multi-Line Node mit Bullets ist
      if (
        text.includes("\n") &&
        (text.includes("•") || text.includes("-")) &&
        !hasProcessedMultiLine
      ) {
        hasProcessedMultiLine = true;
        console.log("  ✂️ Splitting text node:", text.substring(0, 50) + "...");

        // Splitte in Zeilen
        const lines = text
          .split("\n")
          .map((l: string) => l.trim())
          .filter(Boolean);

        // Erkenne Titel und Bullets
        const hasTitle =
          lines.length > 0 &&
          !lines[0]?.startsWith("•") &&
          !lines[0]?.startsWith("-");
        const title = hasTitle ? lines[0] : null;
        const bulletPoints = hasTitle ? lines.slice(1) : lines;

        const baseNx = textNode.nx ?? 0.5;
        const textColor =
          textNode.fill ||
          chooseTextColor(slide.canvas?.bg ?? DEFAULT_CANVAS.bg);
        const textWidth = textNode.width ?? Math.round(width * 0.7);

        // Erstelle Titel-Node
        if (title) {
          console.log("  📝 Creating title node:", title);
          newNodes.push({
            id: `text-title-${nanoid()}`,
            type: "text",
            x: resolveX(baseNx, width),
            y: resolveY(0.25, height),
            nx: baseNx,
            ny: 0.25,
            width: textWidth,
            text: title,
            fontFamily: textNode.fontFamily || "Inter",
            fontSize: (textNode.fontSize || 72) + 10,
            align: "center",
            fill: textColor,
          });
        }

        // Erstelle separate Bullet-Nodes
        if (bulletPoints.length > 0) {
          const startY = title ? 0.4 : 0.3;
          const bulletSpacing = 0.08;

          bulletPoints.forEach((bullet: string, index: number) => {
            const bulletY = startY + index * bulletSpacing;
            console.log(
              `  🔸 Creating bullet ${index + 1}:`,
              bullet.substring(0, 30) + "...",
            );

            newNodes.push({
              id: `text-bullet-${index}-${nanoid()}`,
              type: "text",
              x: resolveX(baseNx, width),
              y: resolveY(bulletY, height),
              nx: baseNx,
              ny: bulletY,
              width: textWidth,
              text: bullet,
              fontFamily: textNode.fontFamily || "Inter",
              fontSize: 50,
              align: "left",
              fill: textColor,
            });
          });
        }
      } else {
        // Behalte andere Text-Nodes unverändert
        newNodes.push(node);
      }
    });

    slide = {
      ...slide,
      canvas: {
        ...slide.canvas,
        nodes: newNodes,
      },
    };
  }

  // Konvertiere alte absolute x/y Koordinaten zu normalisierten nx/ny Koordinaten
  // Dies stellt sicher, dass alle Texte vertikal und horizontal mittig sind
  if (slide.canvas?.nodes) {
    const updatedNodes = slide.canvas.nodes.map((node) => {
      if (node.type !== "text") return node;
      const textNode = node as any;

      // Wenn bereits nx/ny vorhanden sind, nichts ändern
      if (textNode.nx != null && textNode.ny != null) {
        return node;
      }

      // Für alle Text-Nodes ohne nx/ny: Setze auf Mitte (0.5, 0.5)
      // Dies migriert alte Slides mit top-left Positionierung zur Zentrierung
      return {
        ...textNode,
        nx: 0.5, // Horizontal mittig
        ny: 0.5, // Vertikal mittig
        // Behalte alte x/y für Fallback-Kompatibilität, falls benötigt
        x: textNode.x,
        y: textNode.y,
      };
    });

    slide = {
      ...slide,
      canvas: {
        ...slide.canvas,
        nodes: updatedNodes,
      },
    };
  }

  if (!hasImageNode && slide.rootImage?.url) {
    return {
      ...slide,
      canvas: applyBackgroundImageToCanvas(
        slide.canvas,
        slide.rootImage.useGrid ? null : slide.rootImage.url,
        slide.rootImage.useGrid ? slide.rootImage.gridImages : null,
      ),
    };
  }

  return slide;
}

export function ensureSlidesHaveCanvas(slides: PlateSlide[]): PlateSlide[] {
  return slides.map((slide) => ensureSlideCanvas(slide));
}
