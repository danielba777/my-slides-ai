"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useUploadThing } from "@/hooks/globals/useUploadthing";
import type { ReactionAvatar } from "@/types/ugc";
import { Pencil, Trash2, UploadCloud } from "lucide-react";

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
  const [creating, setCreating] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [form, setForm] = useState<AvatarFormState>(createEmptyForm(0));

  const [editOpen, setEditOpen] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState<ReactionAvatar | null>(null);
  const [editForm, setEditForm] = useState<AvatarFormState>(createEmptyForm(0));
  const [editThumbnailUploading, setEditThumbnailUploading] = useState(false);
  const [editVideoUploading, setEditVideoUploading] = useState(false);
  const [editing, setEditing] = useState(false);

  const { startUpload } = useUploadThing("editorUploader");

  const nextOrder = useMemo(() => {
    if (avatars.length === 0) return 0;
    const maxOrder = avatars.reduce(
      (acc, avatar) => Math.max(acc, avatar.order ?? 0),
      0,
    );
    return maxOrder + 1;
  }, [avatars]);

  useEffect(() => {
    void loadAvatars();
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

  const loadAvatars = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ugc/reaction-avatars");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load reaction avatars");
      }
      const avatarsData: ReactionAvatar[] = Array.isArray(data?.avatars)
        ? data.avatars
        : [];
      setAvatars(avatarsData);
      const computedNextOrder =
        avatarsData.length === 0
          ? 0
          : avatarsData.reduce(
              (acc, avatar) => Math.max(acc, avatar.order ?? 0),
              0,
            ) + 1;
      setForm(createEmptyForm(computedNextOrder));
    } catch (error) {
      console.error("[ReactionAvatarsAdmin] loadAvatars failed", error);
      toast.error(
        error instanceof Error ? error.message : "Could not load reaction avatars",
      );
    } finally {
      setLoading(false);
    }
  };

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
        throw new Error(data?.error || "Avatar konnte nicht gespeichert werden");
      }

      toast.success("Reaction Avatar gespeichert");
      resetForm();
      setAvatars((prev) => [data.avatar as ReactionAvatar, ...prev]);
    } catch (error) {
      console.error("[ReactionAvatarsAdmin] handleCreate failed", error);
      toast.error(
        error instanceof Error ? error.message : "Konnte Avatar nicht speichern",
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

  const handleToggleActive = async (avatar: ReactionAvatar, nextValue: boolean) => {
    try {
      const response = await fetch(`/api/ugc/reaction-avatars/${avatar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextValue }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Avatar konnte nicht aktualisiert werden");
      }
      setAvatars((prev) =>
        prev.map((item) => (item.id === avatar.id ? (data.avatar as ReactionAvatar) : item)),
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
      const response = await fetch(`/api/ugc/reaction-avatars/${editingAvatar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim(),
          thumbnailUrl: editForm.thumbnailUrl.trim(),
          videoUrl: editForm.videoUrl.trim(),
          order: Number.isFinite(editForm.order) ? editForm.order : editingAvatar.order ?? 0,
          isActive: editForm.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Avatar konnte nicht aktualisiert werden");
      }
      toast.success("Avatar aktualisiert");
      setAvatars((prev) =>
        prev.map((item) => (item.id === editingAvatar.id ? (data.avatar as ReactionAvatar) : item)),
      );
      setEditOpen(false);
    } catch (error) {
      console.error("[ReactionAvatarsAdmin] handleEditSubmit failed", error);
      toast.error(
        error instanceof Error ? error.message : "Konnte Avatar nicht aktualisieren",
      );
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reaction Avatars</h1>
          <p className="text-sm text-muted-foreground">
            Verwalte Reaktionsvideos, die Nutzer in der UGC-Erstellung auswählen können.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {avatars.length} Avatar{avatars.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Neuen Reaction Avatar anlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="z. B. Smiling Camila"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={3}
                  placeholder="Optional: Details zur Stimmung oder Verwendung"
                />
              </div>

              <div className="space-y-2">
                <Label>Vorschaubild</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={thumbnailUploading}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (event) => {
                        const file = (event.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        void handleFileUpload(
                          file,
                          (url) => setForm((prev) => ({ ...prev, thumbnailUrl: url })),
                          setThumbnailUploading,
                          "image",
                        );
                      };
                      input.click();
                    }}
                  >
                    {thumbnailUploading ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        Lädt�
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UploadCloud className="h-4 w-4" />
                        Bild hochladen
                      </span>
                    )}
                  </Button>
                  <Input
                    value={form.thumbnailUrl}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
                    }
                    placeholder="https://…"
                  />
                </div>
                {form.thumbnailUrl && (
                  <img
                    src={form.thumbnailUrl}
                    alt="Thumbnail preview"
                    className="mt-3 h-40 w-full rounded-lg border object-cover"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Reaktionsvideo</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={videoUploading}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "video/*";
                      input.onchange = (event) => {
                        const file = (event.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        void handleFileUpload(
                          file,
                          (url) => setForm((prev) => ({ ...prev, videoUrl: url })),
                          setVideoUploading,
                          "video",
                        );
                      };
                      input.click();
                    }}
                  >
                    {videoUploading ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        Lädt�
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UploadCloud className="h-4 w-4" />
                        Video hochladen
                      </span>
                    )}
                  </Button>
                  <Input
                    value={form.videoUrl}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, videoUrl: event.target.value }))
                    }
                    placeholder="https://…"
                  />
                </div>
                {form.videoUrl && (
                  <video
                    src={form.videoUrl}
                    controls
                    className="mt-3 h-48 w-full rounded-lg border bg-black object-cover"
                  />
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Direkt aktiv</p>
                  <p className="text-xs text-muted-foreground">
                    Sichtbar in der Auswahl für alle Nutzer
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>

              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Speichere�
                  </span>
                ) : (
                  "Reaction Avatar speichern"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vorhandene Avatars</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            ) : avatars.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Reaction Avatars angelegt.
              </p>
            ) : (
              <div className="space-y-4">
                {avatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row"
                  >
                    <div className="w-full sm:w-40">
                      <img
                        src={avatar.thumbnailUrl}
                        alt={avatar.name}
                        className="h-32 w-full rounded-md object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold">{avatar.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {avatar.description || "Keine Beschreibung"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEditingAvatar(avatar);
                              setEditOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(avatar)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">
                            Sichtbar für Nutzer
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Über Toggle deaktivieren
                          </p>
                        </div>
                        <Switch
                          checked={avatar.isActive ?? true}
                          onCheckedChange={(checked) => handleToggleActive(avatar, checked)}
                        />
                      </div>

                      <div className="rounded-lg border bg-muted/30 p-2">
                        <video
                          src={avatar.videoUrl}
                          controls
                          className="h-40 w-full rounded-md bg-black object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(next) => {
          setEditOpen(next);
          if (!next) {
            setEditingAvatar(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Reaction Avatar bearbeiten</DialogTitle>
          </DialogHeader>
          {editingAvatar ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <Label htmlFor="edit-description">Beschreibung</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={3}
                />
                <Label>Order</Label>
                <Input
                  type="number"
                  value={editForm.order}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      order: Number.parseInt(event.target.value, 10),
                    }))
                  }
                />
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Aktiv</p>
                    <p className="text-xs text-muted-foreground">
                      Avatar im UGC-Builder anzeigen
                    </p>
                  </div>
                  <Switch
                    checked={editForm.isActive}
                    onCheckedChange={(checked) =>
                      setEditForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Vorschaubild</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={editThumbnailUploading}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (event) => {
                          const file = (event.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          void handleFileUpload(
                            file,
                            (url) => setEditForm((prev) => ({ ...prev, thumbnailUrl: url })),
                            setEditThumbnailUploading,
                            "image",
                          );
                        };
                        input.click();
                      }}
                    >
                      {editThumbnailUploading ? (
                        <span className="flex items-center gap-2">
                          <Spinner className="h-4 w-4" />
                          Lädt�
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <UploadCloud className="h-4 w-4" />
                          Bild ändern
                        </span>
                      )}
                    </Button>
                    <Input
                      value={editForm.thumbnailUrl}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
                      }
                    />
                  </div>
                  {editForm.thumbnailUrl && (
                    <img
                      src={editForm.thumbnailUrl}
                      alt="Thumbnail preview"
                      className="mt-2 h-40 w-full rounded-lg border object-cover"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Reaktionsvideo</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={editVideoUploading}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "video/*";
                        input.onchange = (event) => {
                          const file = (event.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          void handleFileUpload(
                            file,
                            (url) => setEditForm((prev) => ({ ...prev, videoUrl: url })),
                            setEditVideoUploading,
                            "video",
                          );
                        };
                        input.click();
                      }}
                    >
                      {editVideoUploading ? (
                        <span className="flex items-center gap-2">
                          <Spinner className="h-4 w-4" />
                          Lädt�
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <UploadCloud className="h-4 w-4" />
                          Video ändern
                        </span>
                      )}
                    </Button>
                    <Input
                      value={editForm.videoUrl}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, videoUrl: event.target.value }))
                      }
                    />
                  </div>
                  {editForm.videoUrl && (
                    <video
                      src={editForm.videoUrl}
                      controls
                      className="mt-2 h-48 w-full rounded-lg border bg-black object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditSubmit} disabled={editing}>
              {editing ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Speichere�
                </span>
              ) : (
                "Speichern"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
