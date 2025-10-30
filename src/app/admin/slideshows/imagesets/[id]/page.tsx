// src/app/admin/slideshows/imagesets/[id]/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ImageSetImage {
  id: string;
  filename: string;
  url: string;
  order: number;
  metadata: any;
}

interface ImageSet {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  images: ImageSetImage[];
  _count?: { images: number };
}

export default function ImageSetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [imageSet, setImageSet] = useState<ImageSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);

  useEffect(() => {
    loadImageSet();
  }, [id]);

  const loadImageSet = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/imagesets/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch image set");
      }
      const data = await response.json();
      setImageSet(data);
    } catch (error) {
      console.error("Error loading image set:", error);
      toast.error("Fehler beim Laden des Bilder-Sets");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImages = async () => {
    if (!uploadFiles || uploadFiles.length === 0) {
      toast.error("Bitte wähle Dateien aus");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    Array.from(uploadFiles).forEach((file) => formData.append("images", file));
    // 👉 Flags gegen serverseitiges Cropping
    formData.append("processing", "none");
    formData.append("fit", "contain");
    formData.append("keepOriginal", "true");

    try {
      const response = await fetch(`/api/imagesets/${id}/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success(`${uploadFiles.length} Bilder erfolgreich hochgeladen`);
        setUploadFiles(null);
        // Reset file input
        const fileInput = document.getElementById("images") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        loadImageSet();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Fehler beim Hochladen der Bilder");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Fehler beim Hochladen der Bilder");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm("Möchtest du dieses Bild wirklich löschen?")) {
      return;
    }

    try {
      const response = await fetch(`/api/imagesets/images/${imageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Bild gelöscht");
        loadImageSet();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Fehler beim Löschen des Bildes");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Fehler beim Löschen des Bildes");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Lade Bilder-Set...</p>
        </div>
      </div>
    );
  }

  if (!imageSet) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Bilder-Set nicht gefunden</p>
          <Button onClick={() => router.push("/admin/slideshows/imagesets")}>
            Zurück zur Übersicht
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit Zurück-Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/slideshows/imagesets")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{imageSet.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {imageSet._count?.images ?? imageSet.images.length} Bilder
            </Badge>
            {imageSet.isActive ? (
              <Badge variant="default" className="text-xs">
                Aktiv
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Inaktiv
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Upload Bereich */}
      <Card>
        <CardHeader>
          <CardTitle>Neue Bilder hochladen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="images">Bilder auswählen</Label>
            <Input
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setUploadFiles(e.target.files)}
              className="mt-1"
            />
            {uploadFiles && (
              <p className="text-sm text-muted-foreground mt-1">
                {uploadFiles.length} Dateien ausgewählt
              </p>
            )}
          </div>

          <Button
            onClick={uploadImages}
            disabled={!uploadFiles || uploadFiles.length === 0 || isUploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Wird hochgeladen..." : "Bilder hochladen"}
          </Button>
        </CardContent>
      </Card>

      {/* Bilder Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Bilder ({imageSet.images.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {imageSet.images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Upload className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                Noch keine Bilder vorhanden
              </p>
              <p className="text-sm">Lade deine ersten Bilder hoch</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {imageSet.images.map((image) => (
                <div
                  key={image.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                >
                  {/* Thumbs vollständig anzeigen, nicht beschneiden */}
                  <img src={image.url} alt={image.filename} className="h-full w-full object-contain" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteImage(image.id)}
                      className="gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      Löschen
                    </Button>
                    <p className="text-xs text-white px-2 text-center line-clamp-2">
                      {image.filename}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
