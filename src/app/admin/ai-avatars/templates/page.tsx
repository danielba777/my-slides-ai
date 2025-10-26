"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Trash2 } from "lucide-react";

type AvatarTemplate = {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
};

export default function AiAvatarTemplatesPage() {
  const [templates, setTemplates] = useState<AvatarTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/ai-avatars/templates");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Konnte Templates nicht laden");
      }
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Laden der Templates",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPrompt("");
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Bitte eine Bilddatei auswählen");
      return;
    }
    setImageFile(file);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) {
      toast.error("Bitte gib einen Prompt ein");
      return;
    }
    if (!imageFile) {
      toast.error("Bitte lade ein Bild hoch");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadData = new FormData();
      uploadData.append("image", imageFile);

      const uploadResponse = await fetch(
        "/api/ai-avatars/templates/upload",
        {
          method: "POST",
          body: uploadData,
        },
      );
      const uploadJson = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadJson?.error || "Bild-Upload fehlgeschlagen");
      }

      const createResponse = await fetch("/api/ai-avatars/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageUrl: uploadJson.url,
          imageKey: uploadJson.key,
        }),
      });
      const createdTemplate = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error(
          createdTemplate?.error || "Template konnte nicht erstellt werden",
        );
      }

      toast.success("Template erstellt");
      resetForm();
      setTemplates((prev) => [createdTemplate, ...prev]);
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error(
        error instanceof Error ? error.message : "Template konnte nicht erstellt werden",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Template wirklich löschen?")) return;
    try {
      const response = await fetch(`/api/ai-avatars/templates/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Template konnte nicht gelöscht werden");
      }
      toast.success("Template gelöscht");
      setTemplates((prev) => prev.filter((template) => template.id !== id));
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(
        error instanceof Error ? error.message : "Template konnte nicht gelöscht werden",
      );
    }
  };

  const templateCountLabel = useMemo(() => {
    const count = templates.length;
    return `${count} Template${count === 1 ? "" : "s"}`;
  }, [templates.length]);

  const getPromptPreview = (value: string) => {
    if (!value) return "";
    return value.length > 120 ? `${value.slice(0, 117)}...` : value;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Avatar Templates</h1>
          <p className="text-sm text-muted-foreground">
            Verwalte Referenzbilder und Prompts für AI Avatars. Jedes Template
            besteht aus einem Bild und einem Prompt.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">{templateCountLabel}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Neues Template anlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(event) =>
                    setPrompt(event.target.value)
                  }
                  rows={6}
                  placeholder="Beschreibe Pose, Outfit, Kamera, Licht usw."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Referenzbild</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Vorschau
                    </p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-48 w-full rounded-lg object-cover border"
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Speichere...
                  </span>
                ) : (
                  "Template speichern"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Vorhandene Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Templates vorhanden.
              </p>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row"
                  >
                    <div className="w-full sm:w-36">
                      <img
                        src={template.imageUrl}
                        alt="AI avatar template preview"
                        className="h-36 w-full rounded-md border object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-xs text-muted-foreground">
                          {new Date(template.createdAt).toLocaleString()}
                        </p>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                          aria-label="Template löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {getPromptPreview(template.prompt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
