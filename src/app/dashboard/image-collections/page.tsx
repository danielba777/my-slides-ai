"use client";

import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  annotateImageSetOwnership,
  hasPersonalCategoryTag,
  isImageSetOwnedByUser,
} from "@/lib/image-set-ownership";
import { cn } from "@/lib/utils";

type ImageSetImage = {
  id: string;
  url: string;
};

type ImageSet = {
  id: string;
  name: string;
  images?: ImageSetImage[];
  children?: ImageSet[];
  _count?: { images?: number; children?: number };
  slug?: string | null;
  category?: string | null;
  isOwnedByUser?: boolean | null;
};

export default function ImageCollectionsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [sets, setSets] = useState<ImageSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    void loadSets();
  }, [session?.user?.id]);

  async function loadSets() {
    try {
      setLoading(true);
      const [setsRes, ownedRes] = await Promise.all([
        fetch("/api/imagesets", { cache: "no-store" }),
        fetch("/api/user-image-collections", { cache: "no-store" }),
      ]);

      if (!setsRes.ok) {
        throw new Error("Failed to load image collections");
      }

      const data = (await setsRes.json()) as ImageSet[] | null;
      const ownedPayload = ownedRes.ok
        ? ((await ownedRes.json()) as { ownedIds?: string[] })
        : null;
      const ownedIds = new Set<string>(ownedPayload?.ownedIds ?? []);
      const userId = session?.user?.id ?? null;

      // 1) Normale Index-Daten annotieren
      const normalized = Array.isArray(data)
        ? data.map((set) =>
            annotateImageSetOwnership(set, userId, ownedIds.has(set.id)),
          )
        : [];

      // 2) Hardening: Falls der Index owned Sets (kurzzeitig) NICHT liefert,
      //    holen wir fehlende owned IDs gezielt nach und mergen sie rein.
      const presentIds = new Set(normalized.map((s) => s.id));
      const missingOwnedIds = Array.from(ownedIds).filter(
        (id) => !presentIds.has(id),
      );

      let recovered: ImageSet[] = [];
      if (missingOwnedIds.length > 0) {
        // Hole Details pro fehlender ID und markiere sie als owned
        const detailCalls = missingOwnedIds.map(async (id) => {
          try {
            const r = await fetch(`/api/imagesets/${id}`, { cache: "no-store" });
            if (!r.ok) return null;
            const full = (await r.json()) as ImageSet;
            return annotateImageSetOwnership(full, userId, true);
          } catch {
            return null;
          }
        });
        const results = await Promise.all(detailCalls);
        recovered = results.filter((x): x is ImageSet => Boolean(x));
      }

      setSets([...(normalized ?? []), ...recovered]);
    } catch (error) {
      console.error("Error loading image collections:", error);
      toast.error("Failed to load image collections");
    } finally {
      setLoading(false);
    }
  }

  const mySets = useMemo(() => {
    const userId = session?.user?.id ?? null;

    const isAiAvatarCollection = (set: ImageSet) => {
      const slug = (set.slug ?? "").toLowerCase();
      const name = (set.name ?? "").toLowerCase();
      const category = (set.category ?? "").toLowerCase();
      return (
        slug.includes("avatar") ||
        name.includes("avatar") ||
        category.includes("avatar")
      );
    };

    const looksPersonal = (set: ImageSet) =>
      hasPersonalCategoryTag(set.category) ||
      hasPersonalCategoryTag(set.slug) ||
      hasPersonalCategoryTag(set.name);

    const belongsToUser = (set: ImageSet) =>
      // Persönliche Sets nur beim Besitzer anzeigen
      isImageSetOwnedByUser(set, userId) || isAiAvatarCollection(set);

    return sets
      .filter(belongsToUser)
      .filter((s) => !looksPersonal(s) || isImageSetOwnedByUser(s, userId));
  }, [sets, session?.user?.id]);

  function getPreviewImages(set: ImageSet): ImageSetImage[] {
    if (Array.isArray(set.images) && set.images.length > 0) {
      return set.images.slice(0, 5);
    }
    if (set.children && set.children.length > 0) {
      return getMixedPreviewImages(set);
    }
    return [];
  }

  function getMixedPreviewImages(parent: ImageSet): ImageSetImage[] {
    if (!parent.children || parent.children.length === 0) {
      return Array.isArray(parent.images) ? parent.images.slice(0, 5) : [];
    }

    const childrenWithImages = parent.children.filter(
      (child) => Array.isArray(child.images) && child.images.length > 0,
    );

    if (childrenWithImages.length === 0) {
      return Array.isArray(parent.images) ? parent.images.slice(0, 5) : [];
    }

    const mixed: ImageSetImage[] = [];
    let idx = 0;

    while (mixed.length < 5 && idx < childrenWithImages.length * 10) {
      const child = childrenWithImages[idx % childrenWithImages.length];
      const imageIndex = Math.floor(idx / childrenWithImages.length);

      const c = child;
      if (c && c.images && imageIndex < c.images.length) {
        const img = c.images[imageIndex];
        if (img) {
          mixed.push(img);
        }
      }
      idx++;
    }

    return mixed.slice(0, 5);
  }

  function handleOpen(set: ImageSet) {
    router.push(`/dashboard/image-collections/${set.id}`);
  }

  async function deleteSet(e: MouseEvent, set: ImageSet) {
    e.stopPropagation();

    if (!confirm(`Delete collection "${set.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/imagesets/${set.id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("Failed to delete collection");
      }

      void fetch(
        `/api/user-image-collections?imageSetId=${encodeURIComponent(set.id)}`,
        { method: "DELETE" },
      ).catch((error) => {
        console.error("Failed to remove collection ownership", error);
      });

      toast.success("Collection deleted");
      await loadSets();
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    }
  }

  // Edit-Button wird entfernt – Öffnen passiert über Card-Klick

  async function createSet() {
    if (!newName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    try {
      const res = await fetch("/api/imagesets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          parentId: null,
          category: "personal",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create collection");
      }

      const created = (await res.json()) as ImageSet;
      void fetch("/api/user-image-collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageSetId: created.id,
          name: created.name,
          slug: created.slug ?? null,
        }),
      }).catch((error) => {
        console.error("Failed to record collection ownership", error);
      });
      const userId = session?.user?.id ?? null;
      const annotated = annotateImageSetOwnership(created, userId, true);

      setSets((prev) => {
        const withoutDuplicate = (prev ?? []).filter(
          (set) => set.id !== annotated.id,
        );
        return [annotated, ...withoutDuplicate];
      });

      toast.success("Collection created");
      setCreating(false);
      setNewName("");
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    }
  }

  return (
    <div className="w-full px-10 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Image Collections</h1>
        <Button
          onClick={() => setCreating(true)}
          className="gap-2 rounded-full px-4"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-full max-h-full pr-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mySets.map((set) => {
               const previewImages = getPreviewImages(set);

               return (
                 <div
                   key={set.id}
                   onClick={() => handleOpen(set)}
                   className="group relative cursor-pointer overflow-visible rounded-lg border border-transparent bg-card p-2 transition hover:border-muted-foreground/30"
                 >
                     <div className="mb-2 truncate text-base font-medium text-foreground">
                       {set.name}
                     </div>

                  {previewImages.length ? (
                    <div className="overflow-hidden">
                      <div className="grid grid-cols-5 gap-0">
                        {previewImages.map((image, index) => (
                          <div
                            key={image.id ?? `${set.id}-${index}`}
                            className={cn(
                              "relative h-24 overflow-hidden md:h-32 lg:h-40",
                              index === 0 && "rounded-l-lg",
                              index === previewImages.length - 1 &&
                                "rounded-r-lg",
                            )}
                          >
                            <img
                              src={image.url}
                              alt={`${set.name} preview ${index + 1}`}
                              className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No preview images available
                    </div>
                  )}
                  {/* Runder roter Delete-Button als Floating-Action in der Ecke */}
                  <button
                    title="Delete collection"
                    onClick={(e) => deleteSet(e as unknown as MouseEvent, set)}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow transition group-hover:opacity-100 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    {/* lucide-trash Icon wird via Tailwind im SVG gestylt */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                   </div>
                 );
               })}

            <button
              type="button"
              onClick={() => setCreating(true)}
              className="group flex h-40 w-full items-center justify-center rounded-lg border-4 border-dashed bg-card p-2 text-sm text-muted-foreground transition hover:border-muted-foreground/60 hover:text-foreground"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create collection
              </div>
            </button>
          </div>
        </ScrollArea>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create image collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="e.g. Product Photos, Lifestyle, Memes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button onClick={createSet}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
