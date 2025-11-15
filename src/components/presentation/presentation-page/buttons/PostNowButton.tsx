"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Rocket, Download, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { blobToDataUrl, blobToJpeg, zipFiles } from "./export-utils";
import { usePresentationState } from "@/states/presentation-state";
import { useSlideshowPostState } from "@/states/slideshow-post-state";

export function PostNowButton() {
  const router = useRouter();
  const setPrepared = useSlideshowPostState((s) => s.setPrepared);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const slides = usePresentationState((s) => s.slides);
  const presentationTitle =
    usePresentationState((s) => s.currentPresentationTitle) ?? "Slides";
  const presentationPrompt = usePresentationState((s) => s.presentationInput);
  const presentationId = usePresentationState((s) => s.currentPresentationId);

  const defaultCaption =
    (presentationPrompt && presentationPrompt.trim().length > 0
      ? presentationPrompt
      : presentationTitle) ?? "";

  const handlePostNow = async () => {
    if (isPreparing) return;
    const exporters: Map<string, () => Promise<Blob>> =
      (window as any).__slideExporters ?? new Map();
    if (!exporters || exporters.size === 0) {
      toast.error(
        "No exporters registered. Please wait until all slides are ready.",
      );
      return;
    }
    if (!slides || slides.length === 0) {
      toast.error("No slides available for export.");
      return;
    }

    setIsPreparing(true);
    try {
      const ordered = slides.map((slide, index) => ({
        id: slide.id as string,
        index,
      }));
      const imageFiles: Array<{ name: string; blob: Blob }> = [];
      const previews: Array<{
        id: string;
        index: number;
        dataUrl: string;
      }> = [];

      for (const { id, index } of ordered) {
        const exporter = exporters.get(id);
        if (!exporter) continue;
        const png = await exporter();
        const jpg = await blobToJpeg(png, 1080, 1620);
        const dataUrl = await blobToDataUrl(jpg);
        const fileName = `${String(index + 1).padStart(3, "0")}.jpg`;
        imageFiles.push({ name: fileName, blob: jpg });
        previews.push({ id, index, dataUrl });
      }

      if (imageFiles.length === 0) {
        toast.error("Export failed – no slides could be converted.");
        return;
      }

      const formData = new FormData();
      for (const file of imageFiles) {
        formData.append("slides", file.blob, file.name);
      }

      const uploadResponse = await fetch(
        "/api/slideshow-library/posts/upload",
        {
          method: "POST",
          body: formData,
        },
      );
      if (!uploadResponse.ok) {
        toast.error("Failed to store slideshow package. Please try again.");
        return;
      }
      const uploadPayload = (await uploadResponse.json().catch(() => null)) as
        | Array<{ url?: string } | string>
        | { error?: string }
        | null;

      if (!Array.isArray(uploadPayload)) {
        const message =
          uploadPayload && typeof uploadPayload.error === "string"
            ? uploadPayload.error
            : "Failed to upload slides";
        toast.error(message);
        return;
      }

      const imageUrls = uploadPayload
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item.url === "string") return item.url;
          return null;
        })
        .filter((url): url is string => typeof url === "string" && url.length > 0);

      if (imageUrls.length !== imageFiles.length) {
        console.error(
          "Unexpected upload response",
          uploadPayload,
        );
        toast.error("Received an invalid upload response.");
        return;
      }

      setPrepared({
        presentationId: presentationId ?? null,
        presentationTitle,
        defaultCaption,
        slideImageUrls: imageUrls,
        slides: previews,
        preparedAt: Date.now(),
      });

      const query = presentationId
        ? `?presentationId=${encodeURIComponent(presentationId)}`
        : "";
      router.push(`/dashboard/create/slideshow${query}`);
    } catch (error) {
      console.error("Failed to prepare slideshow for posting", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    try {
      setIsDownloading(true);
      const exporters: Map<string, () => Promise<Blob>> =
        (window as any).__slideExporters ?? new Map();
      const ordered = slides.map((s, idx) => ({ id: s.id as string, idx }));
      const jpgFiles: Array<{ name: string; blob: Blob }> = [];
      for (const { id, idx } of ordered) {
        const exporter = exporters.get(id);
        if (!exporter) continue;
        const png = await exporter();
        const jpg = await blobToJpeg(png, 1080, 1620);
        const name = `${String(idx + 1).padStart(3, "0")}.jpg`;
        jpgFiles.push({ name, blob: jpg });
      }
      if (jpgFiles.length === 0) return;
      const zipBlob = await zipFiles(jpgFiles);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = `${presentationTitle.replace(/[^\w\-]+/g, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } finally {
      setIsDownloading(false);
    }
  };

  const isLoading = isPreparing || isDownloading;

  return (
    <div className="flex items-center">
      <Button
        size="sm"
        onClick={handlePostNow}
        disabled={isLoading}
        className="rounded-r-none border-r-0"
        style={{ backgroundColor: "#278BF1" }}
      >
        <Rocket className="mr-2 h-4 w-4" />
        {isPreparing ? "Preparing…" : "Post now"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            disabled={isLoading}
            className="rounded-l-none px-2"
            style={{ backgroundColor: "#278BF1" }}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Preparing…" : "Download"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
