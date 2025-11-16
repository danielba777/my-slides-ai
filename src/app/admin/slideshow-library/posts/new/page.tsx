"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowLeft, Save, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface SlideshowAccount {
  id: string;
  username: string;
  displayName: string;
}

interface UploadedSlide {
  url: string;
  filename: string;
  size?: number;
  mimeType?: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdFromUrl = searchParams.get("accountId");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<SlideshowAccount[]>([]);
  const [formData, setFormData] = useState({
    accountId: accountIdFromUrl || "",
    postId: "",
    caption: "",
    categories: [] as string[],
    prompt: "",
    likeCount: 0,
    viewCount: 0,
    commentCount: 0,
    shareCount: 0,
    publishedAt: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString().split("T")[0],
    duration: 0,
  });
  const [uploadedSlides, setUploadedSlides] = useState<UploadedSlide[]>([]);
  const [isUploadingSlides, setIsUploadingSlides] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [categoryInput, setCategoryInput] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await fetch("/api/slideshow-library/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  };

  const normalizeCategory = (value: string) => value.trim();

  const addCategory = () => {
    const value = normalizeCategory(categoryInput);
    if (!value) {
      return;
    }

    setFormData((prev) => {
      const existing = new Set(prev.categories.map((cat) => cat.toLowerCase()));
      if (existing.has(value.toLowerCase())) {
        return prev;
      }

      return {
        ...prev,
        categories: [...prev.categories, value],
      };
    });
    setCategoryInput("");
  };

  const removeCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter(
        (existing) => existing.toLowerCase() !== category.toLowerCase(),
      ),
    }));
  };

  const handleCategoryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCategory();
    } else if (event.key === "Backspace" && !categoryInput.length) {
      setFormData((prev) => ({
        ...prev,
        categories: prev.categories.slice(0, -1),
      }));
    }
  };

  const handleSlidesUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => {
      formData.append("slides", file);
    });

    setIsUploadingSlides(true);
    try {
      const response = await fetch("/api/slideshow-library/posts/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        toast.error("Fehler beim Hochladen der Slides");
        return;
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        toast.error("Ungültige Antwort vom Server");
        return;
      }

      const preparedSlides: UploadedSlide[] = data.map((item) => ({
        url: item.url,
        filename: item.filename ?? item.url,
        size: item.size,
        mimeType: item.mimeType,
      }));

      setUploadedSlides((prev) => [...prev, ...preparedSlides]);
      toast.success(`${preparedSlides.length} Slide-Bilder hochgeladen`);
    } catch (error) {
      console.error("Error uploading slides:", error);
      toast.error("Fehler beim Hochladen der Slides");
    } finally {
      setIsUploadingSlides(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeUploadedSlide = (index: number) => {
    setUploadedSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.accountId || !formData.postId) {
      toast.error("Account und Post ID sind erforderlich");
      return;
    }

    if (!uploadedSlides.length) {
      toast.error("Bitte lade mindestens ein Slide-Bild hoch");
      return;
    }

    setIsSubmitting(true);

    try {
      const slidesPayload = uploadedSlides.map((slide, index) => ({
        slideIndex: index,
        imageUrl: slide.url,
        duration: 3,
      }));

      const categoryMap = new Map<string, string>();
      for (const category of formData.categories) {
        const normalized = category.trim();
        if (!normalized.length) {
          continue;
        }
        const key = normalized.toLowerCase();
        if (!categoryMap.has(key)) {
          categoryMap.set(key, normalized);
        }
      }
      const categories = Array.from(categoryMap.values());

      const response = await fetch("/api/slideshow-library/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categories,
          prompt:
            formData.prompt.trim().length > 0 ? formData.prompt.trim() : null,
          publishedAt: formData?.publishedAt ? new Date(formData.publishedAt) : undefined,
          createdAt: formData?.createdAt ? new Date(formData.createdAt) : undefined,
          slides: slidesPayload,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Post erfolgreich erstellt");
        router.push(`/admin/slideshow-library/accounts/${formData.accountId}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Fehler beim Erstellen des Posts");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Fehler beim Erstellen des Posts");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/slideshow-library/posts"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "flex items-center gap-2",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        <h1 className="text-3xl font-bold">Neuen Post erstellen</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {}
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="accountId">Account *</Label>
                <Select
                  value={formData.accountId}
                  onValueChange={(value) =>
                    handleInputChange("accountId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Account auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        @{account.username} - {account.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postId">Post ID *</Label>
                <Input
                  id="postId"
                  value={formData.postId}
                  onChange={(e) => handleInputChange("postId", e.target.value)}
                  placeholder="TikTok Post ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publishedAt">Veröffentlicht am</Label>
                <Input
                  id="publishedAt"
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) =>
                    handleInputChange("publishedAt", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Dauer (Sekunden)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange("duration", parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                value={formData.caption}
                onChange={(e) => handleInputChange("caption", e.target.value)}
                placeholder="Post Beschreibung"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoriesInput">Kategorien</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="categoriesInput"
                  value={categoryInput}
                  onChange={(event) => setCategoryInput(event.target.value)}
                  onKeyDown={handleCategoryKeyDown}
                  placeholder="Kategorie hinzufügen und Enter drücken"
                  className="sm:max-w-sm"
                />
                <Button type="button" variant="secondary" onClick={addCategory}>
                  Hinzufügen
                </Button>
              </div>
              {formData.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.categories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {category}
                      <button
                        type="button"
                        onClick={() => removeCategory(category)}
                        className="rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label={`Kategorie ${category} entfernen`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Lege eine oder mehrere Kategorien fest, z. B. „Marketing“ oder „Tutorial“.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt (optional)</Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) => handleInputChange("prompt", e.target.value)}
                placeholder="Prompt für die Erstellung dieser Slideshow"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="likeCount">Likes</Label>
                <Input
                  id="likeCount"
                  type="number"
                  value={formData.likeCount}
                  onChange={(e) =>
                    handleInputChange(
                      "likeCount",
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="viewCount">Views</Label>
                <Input
                  id="viewCount"
                  type="number"
                  value={formData.viewCount}
                  onChange={(e) =>
                    handleInputChange(
                      "viewCount",
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commentCount">Comments</Label>
                <Input
                  id="commentCount"
                  type="number"
                  value={formData.commentCount}
                  onChange={(e) =>
                    handleInputChange(
                      "commentCount",
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shareCount">Shares</Label>
                <Input
                  id="shareCount"
                  type="number"
                  value={formData.shareCount}
                  onChange={(e) =>
                    handleInputChange(
                      "shareCount",
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Slides ({uploadedSlides.length})</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Lade hier die fertigen Slide-Bilder des Original-Posts hoch.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => handleSlidesUpload(event.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingSlides}
                >
                  <Upload className="h-4 w-4" />
                  Bilder hochladen
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isUploadingSlides && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Slides werden hochgeladen...
              </div>
            )}

            {uploadedSlides.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {uploadedSlides.map((slide, index) => (
                  <div key={`${slide.url}-${index}`} className="space-y-2">
                    <div className="relative overflow-hidden rounded-md border">
                      <img
                        src={slide.url}
                        alt={`Slide ${index + 1}`}
                        className="h-56 w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur"
                        onClick={() => removeUploadedSlide(index)}
                        aria-label={`Slide ${index + 1} entfernen`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground break-all">
                      {index + 1}. {slide.filename}
                    </div>
                    {slide.size && (
                      <div className="text-[11px] text-muted-foreground">
                        {(slide.size / 1024).toFixed(1)} KB
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Noch keine Slides hochgeladen
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Wird erstellt..." : "Post erstellen"}
          </Button>
          <Link
            href="/admin/slideshow-library/posts"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
