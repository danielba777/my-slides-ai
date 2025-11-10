"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useUploadThing } from "@/hooks/globals/useUploadthing";
import type { DemoVideo } from "@/types/ugc";
import { ExternalLink, Plus, Trash2, Video } from "lucide-react";

type DemoState = "idle" | "loading";

export default function SettingsDemoVideos() {
  const [demos, setDemos] = useState<DemoVideo[]>([]);
  const [state, setState] = useState<DemoState>("loading");
  const [uploading, setUploading] = useState(false);
  // Client-seitig generierte Poster (erstes Frame)
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  const { startUpload } = useUploadThing("editorUploader");

  useEffect(() => {
    void loadDemos();
  }, []);

  // Hilfsfunktion: erstes Frame als DataURL erzeugen
  const generateFirstFrame = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.preload = "metadata";
        video.src = url;
        video.muted = true;
        video.playsInline = true;
        const onLoaded = async () => {
          try {
            // auf 0s seeken; manche Browser feuern erst nach ready
            video.currentTime = 0;
          } catch {
            /* noop */
          }
        };
        const onSeeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 720;
          canvas.height = video.videoHeight || 1280;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("No canvas context"));
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
          video.removeEventListener("loadeddata", onLoaded);
          video.removeEventListener("seeked", onSeeked);
          // Aufräumen
          video.src = "";
        };
        video.addEventListener("loadeddata", onLoaded, { once: true });
        video.addEventListener("seeked", onSeeked, { once: true });
        // Fallback: falls 'seeked' nicht kommt
        setTimeout(() => {
          if (video.readyState >= 2) {
            onSeeked();
          }
        }, 1500);
      } catch (e) {
        reject(e);
      }
    });
  };

  // Für Demos ohne thumbnailUrl ein Poster generieren
  useEffect(() => {
    const run = async () => {
      const items = demos.filter(
        (d) => !d.thumbnailUrl && d.videoUrl && !thumbs[d.id],
      );
      for (const d of items) {
        try {
          const dataUrl = await generateFirstFrame(d.videoUrl!);
          setThumbs((prev) => ({ ...prev, [d.id]: dataUrl }));
        } catch {
          // Ignorieren – dann bleibt der Platzhalter
        }
      }
    };
    if (demos.length > 0) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demos]);

  const loadDemos = async () => {
    try {
      setState("loading");
      const response = await fetch("/api/ugc/demos");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load demo videos");
      }
      const demosData: DemoVideo[] = Array.isArray(data?.demos)
        ? data.demos
        : [];
      setDemos(demosData);
    } catch (error) {
      console.error("[SettingsDemoVideos] loadDemos failed", error);
      toast.error(
        error instanceof Error ? error.message : "Could not load demo videos",
      );
    } finally {
      setState("idle");
    }
  };

  const handleSelectFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      void uploadFileAndCreate(file);
    };
    input.click();
  };

  const uploadFileAndCreate = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    try {
      setUploading(true);
      const result = await startUpload([file]);
      const uploadedUrl = result?.[0]?.url ?? result?.[0]?.ufsUrl;
      if (!uploadedUrl) {
        throw new Error("Upload failed");
      }
      // Save as user demo directly
      const response = await fetch("/api/ugc/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: uploadedUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save demo");
      }
      toast.success("Demo uploaded successfully");
      await loadDemos();
    } catch (error) {
      console.error("[SettingsDemoVideos] uploadFileAndCreate failed", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (demo: DemoVideo) => {
    if (!window.confirm(`Delete demo "${demo.name || demo.id}"?`)) return;
    try {
      const response = await fetch(`/api/ugc/demos/${demo.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to delete demo");
      }
      toast.success("Demo deleted");
      await loadDemos();
    } catch (error) {
      console.error("[SettingsDemoVideos] handleDelete failed", error);
      toast.error(
        error instanceof Error ? error.message : "Unable to delete demo",
      );
    }
  };

  const demoCountLabel = useMemo(() => {
    if (state === "loading") return "Loading...";
    if (demos.length === 0) return "No demos";
    return `${demos.length} Demo${demos.length === 1 ? "" : "s"}`;
  }, [demos.length, state]);

  return (
    <div className="space-y-6 px-1 sm:px-2 lg:px-0">
      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardContent className="p-6 md:p-8">
          {/* Header wie „Personal" */}
          <div className="mb-2">
            <h2 className="text-xl md:text-2xl font-semibold">Demo Videos</h2>
            <p className="text-sm text-muted-foreground">
              Upload short clips and pick them when composing UGC videos.
            </p>
          </div>
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Badge className="border-[#304674]/20 bg-[#304674]/10 px-3 py-1 text-[#304674] hover:bg-[#304674]/10 hover:text-[#304674] cursor-default transition-none">
              <span className="inline-flex items-center gap-2">
                <Video className="h-4 w-4" />
                {demoCountLabel}
              </span>
            </Badge>
          </div>

          {/* Tile view similar to Hook+Demo (slightly larger) */}
          {state === "loading" ? (
            <div className="flex h-28 items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <ScrollArea className="h-[340px] sm:h-[380px] rounded-2xl border border-border/50 bg-muted/40">
              <div className="flex flex-wrap gap-3 p-3">
                {demos.map((demo) => (
                  <div
                    key={demo.id}
                    className="group relative aspect-[9/16] h-[180px] overflow-hidden rounded-xl border bg-black text-white"
                    title={demo.name || "Demo"}
                  >
                    {/* Immer ein Thumbnail zeigen: DB-Thumbnail oder clientseitig generiertes erstes Frame */}
                    {(demo as any).thumbnailUrl || thumbs[demo.id] ? (
                      <img
                        src={(demo as any).thumbnailUrl || thumbs[demo.id]}
                        alt={demo.name || "Demo"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white/70">
                        Loading…
                      </div>
                    )}
                    {/* Delete & External Link */}
                    <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
                      <a
                        href={demo.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(demo)}
                        className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Upload placeholder tile */}
                <button
                  type="button"
                  onClick={handleSelectFile}
                  disabled={uploading}
                  title="Upload demo"
                  className="relative aspect-[9/16] h-[180px] rounded-xl border border-dashed border-border/70 bg-background/60 hover:border-foreground/50 hover:bg-background/80 flex items-center justify-center"
                >
                  {uploading ? (
                    <Spinner className="h-6 w-6" />
                  ) : (
                    <Plus className="h-7 w-7" />
                  )}
                </button>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* No second list below the card needed */}
      {state === "loading" ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      ) : null}
    </div>
  );
}
