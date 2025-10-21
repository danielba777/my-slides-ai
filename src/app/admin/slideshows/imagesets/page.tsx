// src/app/admin/slideshows/imagesets/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Edit, Image as ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ImageSet {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  images: ImageSetImage[];
  _count: { images: number };
}

interface ImageSetImage {
  id: string;
  filename: string;
  url: string;
  order: number;
  metadata: any;
}

export default function ImageSetsAdminPage() {
  const [imageSets, setImageSets] = useState<ImageSet[]>([]);
  const [selectedImageSet, setSelectedImageSet] = useState<ImageSet | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state für neues ImageSet
  const [newImageSet, setNewImageSet] = useState({
    name: "",
    description: "",
    category: "art",
  });

  // Form state für Bearbeitung
  const [editingImageSet, setEditingImageSet] = useState<ImageSet | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "art",
    isActive: true,
  });

  useEffect(() => {
    loadImageSets();
  }, []);

  const loadImageSets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/imagesets");
      if (!response.ok) {
        throw new Error("Failed to fetch image sets");
      }
      const data = await response.json();
      setImageSets(data);
    } catch (error) {
      console.error("Error loading image sets:", error);
      toast.error("Fehler beim Laden der Bilder-Sets");
    } finally {
      setIsLoading(false);
    }
  };

  const createImageSet = async () => {
    if (!newImageSet.name.trim()) {
      toast.error("Name ist erforderlich");
      return;
    }

    try {
      const response = await fetch("/api/imagesets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newImageSet),
      });

      if (response.ok) {
        toast.success("Bilder-Set erstellt");
        setNewImageSet({ name: "", description: "", category: "art" });
        setIsCreating(false);
        loadImageSets();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Fehler beim Erstellen des Bilder-Sets");
      }
    } catch (error) {
      console.error("Error creating image set:", error);
      toast.error("Fehler beim Erstellen des Bilder-Sets");
    }
  };

  const updateImageSet = async () => {
    if (!editingImageSet) return;

    try {
      const response = await fetch(`/api/imagesets/${editingImageSet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast.success("Bilder-Set aktualisiert");
        setEditingImageSet(null);
        loadImageSets();
        // Aktualisiere das ausgewählte Set falls es das gleiche ist
        if (selectedImageSet?.id === editingImageSet.id) {
          const updatedSet = imageSets.find(
            (set) => set.id === editingImageSet.id,
          );
          if (updatedSet) setSelectedImageSet(updatedSet);
        }
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.error || "Fehler beim Aktualisieren des Bilder-Sets",
        );
      }
    } catch (error) {
      console.error("Error updating image set:", error);
      toast.error("Fehler beim Aktualisieren des Bilder-Sets");
    }
  };

  const uploadImages = async () => {
    if (!selectedImageSet || !uploadFiles || uploadFiles.length === 0) {
      toast.error("Bitte wähle ein Bilder-Set und Dateien aus");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();

    // Verwende Array.from() für bessere Type-Safety
    Array.from(uploadFiles).forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await fetch(
        `/api/imagesets/${selectedImageSet.id}/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        toast.success(`${uploadFiles.length} Bilder erfolgreich hochgeladen`);
        setUploadFiles(null);
        loadImageSets();
        // Aktualisiere das ausgewählte Set
        const updatedSet = imageSets.find(
          (set) => set.id === selectedImageSet.id,
        );
        if (updatedSet) setSelectedImageSet(updatedSet);
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
        loadImageSets();
        // Aktualisiere das ausgewählte Set
        if (selectedImageSet) {
          const updatedSet = imageSets.find(
            (set) => set.id === selectedImageSet.id,
          );
          if (updatedSet) setSelectedImageSet(updatedSet);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Fehler beim Löschen des Bildes");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Fehler beim Löschen des Bildes");
    }
  };

  const deleteImageSet = async (imageSetId: string) => {
    if (
      !confirm(
        "Möchtest du dieses Bilder-Set wirklich löschen? Alle Bilder werden entfernt.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/imagesets/${imageSetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Bilder-Set gelöscht");
        setSelectedImageSet(null);
        loadImageSets();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Fehler beim Löschen des Bilder-Sets");
      }
    } catch (error) {
      console.error("Error deleting image set:", error);
      toast.error("Fehler beim Löschen des Bilder-Sets");
    }
  };

  const startEdit = (imageSet: ImageSet) => {
    setEditingImageSet(imageSet);
    setEditForm({
      name: imageSet.name,
      description: imageSet.description || "",
      category: imageSet.category,
      isActive: imageSet.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingImageSet(null);
    setEditForm({
      name: "",
      description: "",
      category: "art",
      isActive: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Bilder-Sets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bilder-Sets verwalten</h1>
          <p className="text-muted-foreground">
            Erstelle und verwalte Bilder-Sets für deine Präsentationen
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Neues Bilder-Set
        </Button>
      </div>

      {/* Neues Bilder-Set erstellen */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Neues Bilder-Set erstellen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newImageSet.name}
                onChange={(e) =>
                  setNewImageSet({ ...newImageSet, name: e.target.value })
                }
                placeholder="z.B. Surrealism"
              />
            </div>
            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={newImageSet.description}
                onChange={(e) =>
                  setNewImageSet({
                    ...newImageSet,
                    description: e.target.value,
                  })
                }
                placeholder="Beschreibung des Bilder-Sets"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category">Kategorie</Label>
              <Select
                value={newImageSet.category}
                onValueChange={(value) =>
                  setNewImageSet({ ...newImageSet, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="art">Kunst</SelectItem>
                  <SelectItem value="nature">Natur</SelectItem>
                  <SelectItem value="abstract">Abstrakt</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="technology">Technologie</SelectItem>
                  <SelectItem value="minimalist">Minimalistisch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={createImageSet}>Erstellen</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bilder-Set bearbeiten */}
      {editingImageSet && (
        <Card>
          <CardHeader>
            <CardTitle>Bilder-Set bearbeiten: {editingImageSet.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="z.B. Surrealism"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Beschreibung des Bilder-Sets"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Kategorie</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="art">Kunst</SelectItem>
                  <SelectItem value="nature">Natur</SelectItem>
                  <SelectItem value="abstract">Abstrakt</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="technology">Technologie</SelectItem>
                  <SelectItem value="minimalist">Minimalistisch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={updateImageSet}>Speichern</Button>
              <Button variant="outline" onClick={cancelEdit}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bilder-Sets Liste */}
        <Card>
          <CardHeader>
            <CardTitle>Bilder-Sets ({imageSets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {imageSets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Bilder-Sets vorhanden</p>
                <p className="text-sm">Erstelle dein erstes Bilder-Set</p>
              </div>
            ) : (
              <div className="space-y-2">
                {imageSets.map((imageSet) => (
                  <div
                    key={imageSet.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedImageSet?.id === imageSet.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedImageSet(imageSet)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{imageSet.name}</h3>
                          {!imageSet.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inaktiv
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {imageSet.description}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {imageSet.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {imageSet._count.images} Bilder
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(imageSet);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteImageSet(imageSet.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bilder-Upload und Verwaltung */}
        {selectedImageSet ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {selectedImageSet.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Bereich */}
              <div>
                <Label htmlFor="images">Neue Bilder hochladen</Label>
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
                disabled={
                  !uploadFiles || uploadFiles.length === 0 || isUploading
                }
                className="w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? "Wird hochgeladen..." : "Bilder hochladen"}
              </Button>

              {/* Aktuelle Bilder */}
              {selectedImageSet.images.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">
                    Aktuelle Bilder ({selectedImageSet.images.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedImageSet.images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteImage(image.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="absolute bottom-1 left-1 right-1">
                          <p className="text-xs text-white bg-black/50 rounded px-1 truncate">
                            {image.filename}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Wähle ein Bilder-Set aus, um Bilder zu verwalten</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
