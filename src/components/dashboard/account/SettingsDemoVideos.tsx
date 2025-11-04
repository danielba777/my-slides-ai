"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useUploadThing } from "@/hooks/globals/useUploadthing";
import type { DemoVideo } from "@/types/ugc";
import { UploadCloud, Video, Trash2, Save } from "lucide-react";

type DemoState = "idle" | "loading";

export default function SettingsDemoVideos() {
  const [demos, setDemos] = useState<DemoVideo[]>([]);
  const [state, setState] = useState<DemoState>("loading");
  const [name, setName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameEdits, setNameEdits] = useState<Record<string, string>>({});

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
      const demosData: DemoVideo[] = Array.isArray(data?.demos) ? data.demos : [];
      setDemos(demosData);
      const names: Record<string, string> = {};
      demosData.forEach((demo) => {
        names[demo.id] = demo.name ?? "";
      });
      setNameEdits(names);
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
      void uploadFile(file);
    };
    input.click();
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file");
      return;
    }
    try {
      setUploading(true);
      const result = await startUpload([file]);
      const uploaded = result?.[0]?.url ?? result?.[0]?.ufsUrl;
      if (!uploaded) {
        throw new Error("Upload fehlgeschlagen");
      }
      setVideoUrl(uploaded);
      toast.success("Video hochgeladen");
    } catch (error) {
      console.error("[SettingsDemoVideos] uploadFile failed", error);
      toast.error("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!videoUrl.trim()) {
      toast.error("Bitte gib eine Video-URL an oder lade ein Video hoch");
      return;
    }
    try {
      setSaving(true);
      const response = await fetch("/api/ugc/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          videoUrl: videoUrl.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Demo konnte nicht gespeichert werden");
      }
      toast.success("Demo saved");
      setName("");
      setVideoUrl("");
      await loadDemos();
    } catch (error) {
      console.error("[SettingsDemoVideos] handleCreate failed", error);
      toast.error(
        error instanceof Error ? error.message : "Konnte Demo nicht speichern",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (demo: DemoVideo) => {
    if (!window.confirm(`Delete demo "${demo.name || demo.id}"?`)) {
      return;
    }
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

  const handleUpdateName = async (demo: DemoVideo) => {
    const nextName = nameEdits[demo.id] ?? "";
    if ((demo.name ?? "") === nextName.trim()) {
      toast.info("No changes");
      return;
    }
    try {
      const response = await fetch(`/api/ugc/demos/${demo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to update demo");
      }
      toast.success("Demo updated");
      await loadDemos();
    } catch (error) {
      console.error("[SettingsDemoVideos] handleUpdateName failed", error);
      toast.error(
        error instanceof Error ? error.message : "Konnte Demo nicht aktualisieren",
      );
    }
  };

  const demoCountLabel = useMemo(() => {
    if (state === "loading") return "Lade...";
    if (demos.length === 0) return "Keine Demos vorhanden";
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
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectFile}
                disabled={uploading}
                className="rounded-xl"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UploadCloud className="h-4 w-4" />
                    Select video
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
      setName("");
      setVideoUrl("");
                }}
                className="rounded-xl"
              >
                Reset
              </Button>
            </div>
          </div>

          <form className="grid gap-4 md:grid-cols-[1fr_280px]" onSubmit={handleCreate}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="demo-name">Titel</Label>
                <Input
                  id="demo-name"
                  placeholder="z. B. Produkt Demo Q4"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-url">Video-URL</Label>
                <Input
                  id="demo-url"
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full md:w-auto md:self-start"
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Saving...
                  </span>
                ) : (
                  "Save demo"
                )}
              </Button>
            </div>

            <div className="rounded-xl border bg-muted/30 p-3">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  className="h-full w-full rounded-lg bg-black object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                  Once you upload or paste a video, the preview appears here.
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {state === "loading" ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      ) : demos.length === 0 ? (
        <div className="rounded-2xl border px-4 py-6 text-center text-sm text-muted-foreground">
          Du hast noch keine Demo-Videos hochgeladen.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {demos.map((demo) => (
            <Card key={demo.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <CardContent className="space-y-4 p-4">
                <video
                  src={demo.videoUrl}
                  controls
                  className="h-48 w-full rounded-xl bg-black object-cover"
                />
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Titel
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={nameEdits[demo.id] ?? ""}
                      onChange={(event) =>
                        setNameEdits((prev) => ({
                          ...prev,
                          [demo.id]: event.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleUpdateName(demo)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(demo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Added on{" "}
                  {new Date(demo.createdAt).toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
