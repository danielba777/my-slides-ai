"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { Download } from "lucide-react";

import { TikTokPostButton } from "./TikTokPostButton";
import { blobToJpeg, zipFiles } from "./export-utils";

export function DownloadSlidesButton() {
  const [downloading, setDownloading] = useState(false);
  const slides = usePresentationState((s) => s.slides);
  const title =
    usePresentationState((s) => s.currentPresentationTitle) || "slides";

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const exporters: Map<string, () => Promise<Blob>> =
        (window as any).__slideExporters ?? new Map();
      // sichere Reihenfolge (aktuelle UI-Reihenfolge im State)
      const ordered = slides.map((s, idx) => ({ id: s.id as string, idx }));
      const jpgFiles: Array<{ name: string; blob: Blob }> = [];
      for (const { id, idx } of ordered) {
        const exporter = exporters.get(id);
        if (!exporter) continue;
        const png = await exporter();
        // Erzwinge Full-Frame 1080×1620 (2:3) + Rand-Clip, danach nach JPG
        const jpg = await blobToJpeg(png, 1080, 1620);
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
      <TikTokPostButton />
    </div>
  );
}
