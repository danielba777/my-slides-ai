// src/app/admin/slideshows/imagesets/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Folder, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ImageSet {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  parentId?: string | null;
  children?: ImageSet[];
  _count: { images: number; children?: number };
  category?: string | null;
}

function removePersonalCollections(sets: ImageSet[] | undefined): ImageSet[] {
  if (!Array.isArray(sets)) {
    return [];
  }

  const filtered: ImageSet[] = [];

  for (const set of sets) {
    const category = (set.category ?? "").toLowerCase();
    // Community-Ansicht: ausschließlich Community zeigen
    // => alle user-erstellten Kategorien verbergen
    if (category === "personal" || category === "mine" || category === "user") {
      continue;
    }

    let nextChildren: ImageSet[] | undefined;
    if (Array.isArray(set.children) && set.children.length > 0) {
      nextChildren = removePersonalCollections(set.children);
    }

    filtered.push(
      nextChildren && nextChildren.length > 0
        ? { ...set, children: nextChildren }
        : { ...set, children: nextChildren },
    );
  }

  return filtered;
}

export default function ImageSetsAdminPage() {
  const router = useRouter();
  const [imageSets, setImageSets] = useState<ImageSet[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [parentForNew, setParentForNew] = useState<string | null>(null);

  // Form state für neues ImageSet
  const [newImageSet, setNewImageSet] = useState({
    name: "",
    parentId: null as string | null,
  });

  // Form state für Bearbeitung
  const [editingImageSet, setEditingImageSet] = useState<ImageSet | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    isActive: true,
  });

  useEffect(() => {
    loadImageSets();
  }, []);

  const loadImageSets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/imagesets", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch image sets");
      }
      const data = await response.json();
      // Wichtig: Im "Imagesets"-Bereich nur Community anzeigen – Personal rausfiltern
      setImageSets(removePersonalCollections(data));
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
        setNewImageSet({
          name: "",
          parentId: null,
        });
        setIsCreating(false);
        setParentForNew(null);
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
      isActive: imageSet.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingImageSet(null);
    setEditForm({
      name: "",
      isActive: true,
    });
  };

  // Hierarchie-Helfer: Baue Baumstruktur
  const buildTree = (sets: ImageSet[]): ImageSet[] => {
    const map = new Map<string, ImageSet>();
    const roots: ImageSet[] = [];

    // Erstelle Map mit allen Sets
    sets.forEach((set) => {
      map.set(set.id, { ...set, children: [] });
    });

    // Ordne children zu parents zu
    sets.forEach((set) => {
      const node = map.get(set.id)!;
      if (set.parentId) {
        const parent = map.get(set.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          roots.push(node); // Fallback wenn Parent nicht gefunden
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  // Flache Liste für Tabelle mit Einrückung
  const flattenTree = (
    sets: ImageSet[],
    level = 0,
  ): Array<ImageSet & { level: number }> => {
    const result: Array<ImageSet & { level: number }> = [];

    sets.forEach((set) => {
      result.push({ ...set, level });
      if (set.children && set.children.length > 0) {
        result.push(...flattenTree(set.children, level + 1));
      }
    });

    return result;
  };

  const treeData = buildTree(imageSets);
  const flatData = flattenTree(treeData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
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
        <Button
          onClick={() => {
            setIsCreating(true);
            setParentForNew(null);
            setNewImageSet({
              name: "",
              parentId: null,
            });
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Neues Bilder-Set
        </Button>
      </div>

      {/* Neues Bilder-Set erstellen */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {parentForNew
                ? `Unterordner erstellen unter: ${imageSets.find((s) => s.id === parentForNew)?.name}`
                : "Neues Bilder-Set erstellen"}
            </CardTitle>
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
                placeholder="z.B. Healthy Nutrition"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createImageSet}>Erstellen</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setParentForNew(null);
                }}
              >
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
                placeholder="z.B. Healthy Nutrition"
              />
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

      {/* Kompakte Tabellenansicht */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Bilder-Sets ({imageSets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {imageSets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                Noch keine Bilder-Sets vorhanden
              </p>
              <p className="text-sm">Erstelle dein erstes Bilder-Set</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Name</TableHead>
                    <TableHead className="text-center">Bilder</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flatData.map((imageSet) => (
                    <TableRow
                      key={imageSet.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        router.push(
                          `/admin/slideshows/imagesets/${imageSet.id}`,
                        )
                      }
                    >
                      <TableCell className="font-medium">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: `${imageSet.level * 24}px` }}
                        >
                          <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{imageSet.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {imageSet._count.images}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {imageSet.isActive ? (
                          <Badge variant="default" className="text-xs">
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Inaktiv
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setParentForNew(imageSet.id);
                              setNewImageSet({
                                ...newImageSet,
                                parentId: imageSet.id,
                              });
                              setIsCreating(true);
                            }}
                            title="Unterordner erstellen"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
