"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    void loadImageSet();
  }, [id]);

  async function loadImageSet() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/imagesets/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch image set");
      const data = await response.json();
      setImageSet(data);
    } catch (error) {
      console.error("Error loading image set:", error);
      toast.error("Fehler beim Laden des Bilder-Sets");
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadImages() {
    if (!uploadFiles || uploadFiles.length === 0) {
      toast.error("Bitte wähle Dateien aus");
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    Array.from(uploadFiles).forEach((file) => formData.append("images", file));

    try {
      const response = await fetch(`/api/imagesets/${id}/upload`, { method: "POST", body: formData });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error ?? "Fehler beim Hochladen der Bilder");
      }
      toast.success(`${uploadFiles.length} Bilder erfolgreich hochgeladen`);
      setUploadFiles(null);
      const fileInput = document.getElementById("images") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      await loadImageSet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Hochladen der Bilder");
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteImage(imageId: string) {
    if (!confirm("Möchtest du dieses Bild wirklich löschen?")) return;
    try {
      const response = await fetch(`/api/imagesets/images/${imageId}`, { method: "DELETE" });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error ?? "Fehler beim Löschen des Bildes");
      }
      toast.success("Bild gelöscht");
      await loadImageSet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Löschen des Bildes");
    }
  }

  return (
    <div className="w-full px-10 py-12 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.push("/dashboard/image-collections")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">{imageSet?.name ?? "Image Collection"}</h1>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Upload images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Input id="images" type="file" accept="image/*" multiple onChange={(e) => setUploadFiles(e.target.files)} />
            <Button onClick={uploadImages} disabled={isUploading}>
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading…" : "Upload"}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {imageSet?.images?.map((image) => (
                <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  <img src={image.url} alt={image.filename} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="destructive" size="sm" onClick={() => deleteImage(image.id)} className="gap-2">
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
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
