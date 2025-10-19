"use client";

import { Button } from "@/components/ui/button";
import { Download, Rocket } from "lucide-react";
import { useState } from "react";
import { usePresentationState } from "@/states/presentation-state";

// JSZip wird lazy geladen, damit initialer Bundle klein bleibt
async function zipFiles(files: Array<{ name: string; blob: Blob }>): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.name, f.blob);
  }
  const content = await zip.generateAsync({ type: "blob" });
  return content;
}

// Lädt einen Blob als HTMLImageElement
async function loadBlobAsImage(blob: Blob): Promise<HTMLImageElement> {
  const dataUrl = await new Promise<string>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Erzwingt Full-Frame-Export 1080x1920 und harten Rand-Clip (kein „mittendrin"-Crop)
async function normalizeToDesignPNG(pngBlob: Blob, W = 1080, H = 1920): Promise<Blob> {
  const img = await loadBlobAsImage(pngBlob);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // harter Frame-Clip (0,0,W,H)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  // Wichtig: Alles 1:1 in den Frame zeichnen.
  // Falls das Quellbild nicht exakt W×H hat (z.B. wegen Preview-Zoom),
  // wird hier proportional auf den Ziel-Frame gelegt.
  // Wenn deine Canvas bereits W×H ist, ist das ein 1:1 Draw ohne Shift.
  ctx.drawImage(img, 0, 0, W, H);
  ctx.restore();
  const out = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  return out ?? pngBlob;
}

async function blobToJpeg(pngBlob: Blob, W = 1080, H = 1920): Promise<Blob> {
  // Erst sicherstellen, dass wir exakt den vollen Frame (1080×1920) haben
  const normalized = await normalizeToDesignPNG(pngBlob, W, H);
  const img = await loadBlobAsImage(normalized);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, W, H);
  const jpg = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
  );
  return jpg ?? normalized;
}

export function DownloadSlidesButton() {
  const [downloading, setDownloading] = useState(false);
  const slides = usePresentationState((s) => s.slides);
  const title = usePresentationState((s) => s.currentPresentationTitle) || "slides";

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const exporters: Map<string, () => Promise<Blob>> = (window as any).__slideExporters ?? new Map();
      // sichere Reihenfolge (aktuelle UI-Reihenfolge im State)
      const ordered = slides.map((s, idx) => ({ id: s.id as string, idx }));
      const jpgFiles: Array<{ name: string; blob: Blob }> = [];
      for (const { id, idx } of ordered) {
        const exporter = exporters.get(id);
        if (!exporter) continue;
        const png = await exporter();
        // Erzwinge Full-Frame 1080×1920 + Rand-Clip, danach nach JPG
        const jpg = await blobToJpeg(png, 1080, 1920);
        const name = `${String(idx + 1).padStart(2, "0")}.jpg`;
        jpgFiles.push({ name, blob: jpg });
      }
      if (jpgFiles.length === 0) return;
      const zipBlob = await zipFiles(jpgFiles);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = `${title.replace(/[^\w\-]+/g, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={handleDownload}
        disabled={downloading}
        title="Download all slides as JPG (.zip)"
      >
        <Download className="mr-2 h-4 w-4" />
        {downloading ? "Preparing…" : "Download JPG (.zip)"}
      </Button>
      <Button variant="secondary" size="sm" disabled title="Coming soon">
        <Rocket className="mr-2 h-4 w-4" />
        Post to TikTok (Soon)
      </Button>
    </div>
  );
}