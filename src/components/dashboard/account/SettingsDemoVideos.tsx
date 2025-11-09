"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const { startUpload } = useUploadThing("editorUploader");

  useEffect(() => {
    void loadDemos();
  }, []);

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
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Badge className="border-[#304674]/20 bg-[#304674]/10 px-3 py-1 text-[#304674] cursor-default transition-none">
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
                    {/* Thumbnail if available, otherwise dark area */}
                    {"thumbnailUrl" in demo && (demo as any).thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={(demo as any).thumbnailUrl}
                        alt={demo.name || "Demo"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white/70">
                        Demo
                      </div>
                    )}

                    {/* Hover overlay: open & delete */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const target = demo.videoUrl?.startsWith("http")
                            ? demo.videoUrl
                            : `${window.location.origin}${
                                demo.videoUrl?.startsWith("/")
                                  ? demo.videoUrl
                                  : `/${demo.videoUrl}`
                              }`;
                          window.open(target, "_blank", "noopener,noreferrer");
                        }}
                        className="rounded-full"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(demo)}
                        className="rounded-full"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
