"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { blobToDataUrl, blobToJpeg, zipFiles } from "@/components/presentation/presentation-page/buttons/export-utils";
import { usePresentationState } from "@/states/presentation-state";
import { useSlideshowPostState } from "@/states/slideshow-post-state";
import { Rocket } from "lucide-react";

export function TikTokPostButton() {
  const router = useRouter();
  const setPrepared = useSlideshowPostState((s) => s.setPrepared);
  const [isPreparing, setIsPreparing] = useState(false);

  const slides = usePresentationState((s) => s.slides);
  const presentationTitle =
    usePresentationState((s) => s.currentPresentationTitle) ?? "Slides";
  const presentationPrompt = usePresentationState((s) => s.presentationInput);
  const presentationId = usePresentationState((s) => s.currentPresentationId);

  const defaultCaption =
    (presentationPrompt && presentationPrompt.trim().length > 0
      ? presentationPrompt
      : presentationTitle) ?? "";

  const handlePrepareAndNavigate = async () => {
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

      const zipBlob = await zipFiles(imageFiles);
      const zipFile = new File(
        [zipBlob],
        `${presentationTitle.replace(/[^\w\-]+/g, "_")}-${Date.now()}.zip`,
        { type: "application/zip" },
      );
      const formData = new FormData();
      formData.append("slides", zipFile);

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
        | Array<{ url?: string }>
        | { error?: string }
        | null;
      const zipUrl = Array.isArray(uploadPayload)
        ? uploadPayload[0]?.url ?? null
        : null;
      if (!zipUrl) {
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
        zipUrl,
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

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => void handlePrepareAndNavigate()}
      disabled={isPreparing}
    >
      <Rocket className="mr-2 h-4 w-4" />
      {isPreparing ? "Preparing…" : "Post to TikTok"}
    </Button>
  );
}
