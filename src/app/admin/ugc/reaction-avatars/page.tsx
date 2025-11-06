"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useUploadThing } from "@/hooks/globals/useUploadthing";
import type { ReactionAvatar } from "@/types/ugc";

type AvatarFormState = {
  name: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  order: number;
  isActive: boolean;
};

const createEmptyForm = (order: number): AvatarFormState => ({
  name: "",
  description: "",
  thumbnailUrl: "",
  videoUrl: "",
  order,
  isActive: true,
});

export default function ReactionAvatarsAdminPage() {
  const [avatars, setAvatars] = useState<ReactionAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [form, setForm] = useState<AvatarFormState>(createEmptyForm(0));

  const [editOpen, setEditOpen] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState<ReactionAvatar | null>(
    null,
  );
  const [editForm, setEditForm] = useState<AvatarFormState>(createEmptyForm(0));
  const [editThumbnailUploading, setEditThumbnailUploading] = useState(false);
  const [editVideoUploading, setEditVideoUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  // 302.ai generation UI
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generateCount, setGenerateCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [targetAvatar, setTargetAvatar] = useState<ReactionAvatar | null>(null);
  
  const { startUpload } = useUploadThing("editorUploader");

  const nextOrder = useMemo(() => {
    if (avatars.length === 0) return 0;
    const maxOrder = avatars.reduce(
      (acc, avatar) => Math.max(acc, avatar.order ?? 0),
      0,
    );
    return maxOrder + 1;
  }, [avatars]);

  // Beim Öffnen der Seite: zuerst automatisch aus Templates importieren, dann Liste laden.
  useEffect(() => {
    const autoImportAndFetch = async () => {
      try {
        await fetch("/api/ugc/reaction-avatars/import-from-templates", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        // stiller Fail: wenn Import fehlschlägt, zeigen wir einfach den aktuellen Stand
      } finally {
        await fetchAvatars();
      }
    };
    void autoImportAndFetch();
  }, []);

  useEffect(() => {
    setForm((prev) =>
      prev.thumbnailUrl || prev.videoUrl || prev.name
        ? prev
        : { ...prev, order: nextOrder },
    );
  }, [nextOrder]);

  useEffect(() => {
    if (!editOpen || !editingAvatar) {
      return;
    }
    setEditForm({
      name: editingAvatar.name ?? "",
      description: editingAvatar.description ?? "",
      thumbnailUrl: editingAvatar.thumbnailUrl,
      videoUrl: editingAvatar.videoUrl,
      order: editingAvatar.order ?? 0,
      isActive: editingAvatar.isActive ?? true,
    });
  }, [editOpen, editingAvatar]);

  const openGenerateForAvatar = (avatar: ReactionAvatar) => {
    setTargetAvatar(avatar);
    setGeneratePrompt("");
    setGenerateCount(1);
    setGenerateOpen(true);
  };

  const doGenerate = async () => {
    if (!targetAvatar) {
      toast.error("Kein Avatar ausgewaehlt");
      return;
    }
    if (!generatePrompt.trim()) {
      toast.error("Prompt darf nicht leer sein");
      return;
    }
    try {
      setGenerating(true);
      const res = await fetch("/api/admin/ugc/reaction-avatars/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarIds: [targetAvatar.id],
          prompt: generatePrompt.trim(),
          count: generateCount,
          mode: "std",
        }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Fallback: Rohtext lesen, falls die Route (z.B. wegen Crash) keinen JSON-Body lieferte
        const raw = await res.text().catch(() => "");
        if (!res.ok) {
          throw new Error(
            (raw && raw.slice(0, 300)) || "Generierung fehlgeschlagen",
          );
        }
      }
      if (!res.ok) throw new Error(data?.error || "Generierung fehlgeschlagen");
      // Sofortige Preview/CTA, falls die API bereits die videoUrl liefert
      if (data?.videoUrl) {
        toast.success(`Video fertig (${data?.usedMode ?? "STD"})`);
      } else {
        toast.success(`Generiert mit fal.ai Pika ${data?.usedMode?.toUpperCase() ?? "STD"}`);
      }
      // refresh list
      await fetchAvatars();
      setGenerateOpen(false);
      setTargetAvatar(null);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Fehler bei 302.ai");
    } finally {
      setGenerating(false);
    }
  };

  const fetchAvatars = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ugc/reaction-avatars", {
        cache: "no-store",
      });
      const data = await res.json();
      setAvatars(Array.isArray(data?.avatars) ? data.avatars : []);
    } catch (e) {
      toast.error("Konnte Reaction Avatars nicht laden");
    } finally {
      setLoading(false);
    }
  };

  const importFromTemplates = async () => {
    setImporting(true);
    try {
      const res = await fetch(
        "/api/ugc/reaction-avatars/import-from-templates",
        {
          method: "POST",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Import fehlgeschlagen");
      } else {
        const msg =
          typeof data?.imported === "number"
            ? `Importiert: ${data.imported} • Übersprungen: ${data.skipped ?? 0}`
            : "Import abgeschlossen";
        toast.success(msg);
        await fetchAvatars();
      }
    } catch {
      toast.error("Import fehlgeschlagen");
    } finally {
      setImporting(false);
    }
  };
  const maxOrder = useMemo(
    () => (avatars.length ? Math.max(...avatars.map((a) => a.order ?? 0)) : 0),
    [avatars],
  );

  const resetForm = () => {
    setForm(createEmptyForm(nextOrder));
  };

  const handleFileUpload = async (
    file: File,
    onSuccess: (url: string) => void,
    setUploading: (value: boolean) => void,
    expectedType: "image" | "video",
  ) => {
    if (expectedType === "image" && !file.type.startsWith("image/")) {
      toast.error("Bitte ein Bild auswählen");
      return;
    }
    if (expectedType === "video" && !file.type.startsWith("video/")) {
      toast.error("Bitte ein Video auswählen");
      return;
    }

    try {
      setUploading(true);
      const uploadResult = await startUpload([file]);
      const uploaded = uploadResult?.[0]?.url ?? uploadResult?.[0]?.ufsUrl;
      if (!uploaded) {
        throw new Error("Upload fehlgeschlagen");
      }
      onSuccess(uploaded);
      toast.success("Upload abgeschlossen");
    } catch (error) {
      console.error("[ReactionAvatarsAdmin] upload failed", error);
      toast.error("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Bitte gib einen Namen an");
      return;
    }
    if (!form.thumbnailUrl.trim()) {
      toast.error("Bitte lade ein Vorschaubild hoch");
      return;
    }
    if (!form.videoUrl.trim()) {
      toast.error("Bitte lade ein Reaktionsvideo hoch");
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/ugc/reaction-avatars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          thumbnailUrl: form.thumbnailUrl.trim(),
          videoUrl: form.videoUrl.trim(),
          order: Number.isFinite(form.order) ? form.order : nextOrder,
          isActive: form.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error || "Avatar konnte nicht gespeichert werden",
        );
      }

      toast.success("Reaction Avatar gespeichert");
      resetForm();
      setAvatars((prev) => [data.avatar as ReactionAvatar, ...prev]);
    } catch (error) {
      console.error("[ReactionAvatarsAdmin] handleCreate failed", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Konnte Avatar nicht speichern",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (avatar: ReactionAvatar) => {
    if (!window.confirm(`Avatar "${avatar.name}" wirklich löschen?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/ugc/reaction-avatars/${avatar.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Avatar konnte nicht gelöscht werden");
      }
      toast.success("Avatar gelöscht");
      setAvatars((prev) => prev.filter((item) => item.id !== avatar.id));
    } catch (error) {
      console.error("[ReactionAvatarsAdmin] handleDelete failed", error);
      toast.error(
        error instanceof Error ? error.message : "Konnte Avatar nicht löschen",
      );
    }
  };

  const handleToggleActive = async (
    avatar: ReactionAvatar,
    nextValue: boolean,
  ) => {
    try {
      const response = await fetch(`/api/ugc/reaction-avatars/${avatar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextValue }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error || "Avatar konnte nicht aktualisiert werden",
        );
      }
      setAvatars((prev) =>
        prev.map((item) =>
          item.id === avatar.id ? (data.avatar as ReactionAvatar) : item,
        ),
      );
    } catch (error) {
      console.error("[ReactionAvatarsAdmin] toggleActive failed", error);
      toast.error("Status konnte nicht aktualisiert werden");
    }
  };

  const handleEditSubmit = async () => {
    if (!editingAvatar) return;
    if (!editForm.name.trim()) {
      toast.error("Bitte gib einen Namen an");
      return;
    }
    if (!editForm.thumbnailUrl.trim()) {
      toast.error("Bitte gib ein Vorschaubild an");
      return;
    }
    if (!editForm.videoUrl.trim()) {
      toast.error("Bitte gib ein Video an");
      return;
    }

    try {
      setEditing(true);
      const response = await fetch(
        `/api/ugc/reaction-avatars/${editingAvatar.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editForm.name.trim(),
            description: editForm.description.trim(),
            thumbnailUrl: editForm.thumbnailUrl.trim(),
            videoUrl: editForm.videoUrl.trim(),
            order: Number.isFinite(editForm.order)
              ? editForm.order
              : (editingAvatar.order ?? 0),
            isActive: editForm.isActive,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error || "Avatar konnte nicht aktualisiert werden",
        );
      }
      toast.success("Avatar aktualisiert");
      setAvatars((prev) =>
        prev.map((item) =>
          item.id === editingAvatar.id ? (data.avatar as ReactionAvatar) : item,
        ),
      );
      setEditOpen(false);
    } catch (error) {
      console.error("[ReactionAvatarsAdmin] handleEditSubmit failed", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Konnte Avatar nicht aktualisieren",
      );
    } finally {
      setEditing(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Reaction Avatars</h1>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={importFromTemplates}
            disabled={importing}
          >
            {importing ? "Importiere …" : "Aus Templates importieren"}
          </Button>
          <Button
            onClick={() => {
              setForm(createEmptyForm(maxOrder + 1));
              setCreating(true);
            }}
          >
            Neu anlegen
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6">
          <Spinner className="h-4 w-4" />
          <span>Lade …</span>
        </div>
      ) : avatars.length === 0 ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Noch keine Reaction Avatars angelegt.</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Du kannst neue Reaction Avatars erstellen oder deine vorhandenen
              AI-Avatar Templates importieren.
            </p>
            <Button onClick={importFromTemplates} disabled={importing}>
              {importing ? "Importiere …" : "Aus Templates importieren"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {avatars.map((a) => {
            const video = a.videoUrl?.trim();
            const hasHookVideo =
              !!video && video.length > 0 && video !== "about:blank";

            return (
              <Card key={a.id}>
                <CardContent className="space-y-3 pt-6">
                  <Button
                    className="w-full"
                    onClick={() => openGenerateForAvatar(a)}
                    disabled={generating && targetAvatar?.id === a.id}
                    title={a.name}
                  >
                    {generating && targetAvatar?.id === a.id
                      ? "Generiere..."
                      : "Generate Hook Video"}
                  </Button>
                  {hasHookVideo && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (!video) return;
                        const target = video.startsWith("http")
                          ? video
                          : `${window.location.origin}${video.startsWith("/") ? video : `/${video}`}`;
                        window.open(target, "_blank", "noopener,noreferrer");
                      }}
                    >
                      Hook Video ansehen
                    </Button>
                  )}
                <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.thumbnailUrl}
                    alt={a.name || "Reaction Avatar"}
                    className="h-full w-full object-cover"
                  />
                </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog
        open={generateOpen}
        onOpenChange={(open) => {
          setGenerateOpen(open);
          if (!open) {
            setTargetAvatar(null);
            setGeneratePrompt("");
            setGenerateCount(1);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Generate Hook Video</DialogTitle>
            <DialogDescription>
              Erzeuge ein 5s Hook-Video mit 302.ai Avatar-4.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {targetAvatar && (
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={targetAvatar.thumbnailUrl}
                    alt={targetAvatar.name ?? "Reaction Avatar"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{targetAvatar.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Ergebnis ersetzt das vorhandene Video des Avatars.
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="hook-generate-prompt">Prompt</Label>
              <Textarea
                id="hook-generate-prompt"
                value={generatePrompt}
                onChange={(event) => setGeneratePrompt(event.target.value)}
                rows={5}
                placeholder="Beschreibe Hook, Stimmung, Kamera, Sprache ..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hook-generate-count">Varianten (1-5)</Label>
              <Input
                id="hook-generate-count"
                type="number"
                min={1}
                max={5}
                value={generateCount}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isNaN(next)) return;
                  setGenerateCount(Math.min(Math.max(next, 1), 5));
                }}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-4 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              disabled={generating}
              onClick={() => {
                setGenerateOpen(false);
                setTargetAvatar(null);
                setGeneratePrompt("");
                setGenerateCount(1);
              }}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={doGenerate}
              disabled={generating}
            >
              {generating ? "Generiere..." : "Video erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
