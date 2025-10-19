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

async function blobToJpeg(pngBlob: Blob): Promise<Blob> {
  // PNG -> JPEG (ohne Größenänderung) via Offscreen Canvas
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(pngBlob);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
  );
  return blob ?? pngBlob;
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
        const jpg = await blobToJpeg(png);
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