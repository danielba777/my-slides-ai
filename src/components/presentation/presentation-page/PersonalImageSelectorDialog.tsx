"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  annotateImageSetOwnership,
  isImageSetOwnedByUser as checkOwnership,
} from "@/lib/image-set-ownership";

type ImageSetImage = { id?: string; url: string };

type ImageSet = {
  id: string;
  name: string;
  category?: string | null;
  slug?: string | null;
  images?: ImageSetImage[];
  _count?: { images?: number; children?: number };
  isOwnedByUser?: boolean;
  parentId?: string | null;
  children?: ImageSet[];
};

interface PersonalImageSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (imageUrl: string) => void;
}

export default function PersonalImageSelectorDialog({
  open,
  onOpenChange,
  onConfirm,
}: PersonalImageSelectorDialogProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const [imageSets, setImageSets] = useState<ImageSet[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [drillDownParent, setDrillDownParent] = useState<ImageSet | null>(null);
  const [selectedSet, setSelectedSet] = useState<ImageSet | null>(null);
  const [collectionImages, setCollectionImages] = useState<ImageSetImage[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadImageSets = async () => {
      try {
        setIsLoadingSets(true);
        const [setsRes, ownedRes] = await Promise.all([
          fetch("/api/imagesets", { cache: "no-store" }),
          fetch("/api/user-image-collections", { cache: "no-store" }),
        ]);
        if (!setsRes.ok) {
          throw new Error("Failed to fetch image collections");
        }
        const data = (await setsRes.json()) as unknown;
        const ownedPayload = ownedRes.ok
          ? ((await ownedRes.json()) as { ownedIds?: string[] })
          : null;
        const ownedIds = new Set<string>(ownedPayload?.ownedIds ?? []);

        if (Array.isArray(data)) {
          const normalized = data.map((set: ImageSet) =>
            annotateImageSetOwnership(
              set,
              userId,
              ownedIds.has(set.id),
            ),
          );
          setImageSets(normalized);
        } else {
          setImageSets([]);
        }
      } catch (error) {
        console.error("Error loading personal image collections:", error);
        setImageSets([]);
      } finally {
        setIsLoadingSets(false);
      }
    };

    if (open) {
      void loadImageSets();
      setSelectedSet(null);
      setSelectedImageUrl(null);
      setCollectionImages([]);
      setDrillDownParent(null);
    }
  }, [open, userId]);

  const isAiAvatarCollection = useCallback((set: ImageSet) => {
    const slug = (set.slug ?? "").toLowerCase();
    const name = (set.name ?? "").toLowerCase();
    const category = (set.category ?? "").toLowerCase();
    return (
      slug.includes("avatar") ||
      name.includes("avatar") ||
      category.includes("avatar")
    );
  }, []);

  const belongsToUser = useCallback(
    (set: ImageSet) => {
      const category = set.category?.toLowerCase() ?? "";
      return (
        checkOwnership(set, userId ?? null) ||
        category === "personal" ||
        category === "mine" ||
        category === "user" ||
        isAiAvatarCollection(set)
      );
    },
    [isAiAvatarCollection, userId],
  );

  const availableCollections = useMemo(() => {
    if (drillDownParent) {
      const children =
        (drillDownParent.children && drillDownParent.children.length > 0
          ? drillDownParent.children
          : imageSets.filter((set) => set.parentId === drillDownParent.id)) ??
        [];
      return children.filter(belongsToUser);
    }
    return imageSets.filter((set) => !set.parentId).filter(belongsToUser);
  }, [belongsToUser, drillDownParent, imageSets]);

  const getPreviewImages = (set: ImageSet): ImageSetImage[] => {
    if (Array.isArray(set.images) && set.images.length > 0) {
      return set.images.slice(0, 5);
    }
    if (set.children && set.children.length > 0) {
      return getMixedPreviewImages(set);
    }
    return [];
  };

  const getMixedPreviewImages = (parent: ImageSet): ImageSetImage[] => {
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
      if (child.images && imageIndex < child.images.length) {
        mixed.push(child.images[imageIndex]);
      }
      idx++;
    }
    return mixed.slice(0, 5);
  };

  const fetchCollectionImages = async (set: ImageSet) => {
    try {
      setIsLoadingImages(true);
      const response = await fetch(`/api/imagesets/${set.id}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch collection images");
      }
      const data = (await response.json()) as ImageSet;
      const merged: ImageSet = { ...set, ...data };
      setSelectedSet(merged);
      setCollectionImages(Array.isArray(merged.images) ? merged.images : []);
    } catch (error) {
      console.error("Error loading collection images:", error);
      setCollectionImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleSelectCollection = (set: ImageSet) => {
    const hasChildren =
      (set.children && set.children.length > 0) ||
      (set._count?.children && set._count.children > 0);

    if (hasChildren) {
      setDrillDownParent(set);
      return;
    }

    setSelectedSet(set);
    setSelectedImageUrl(null);
    setCollectionImages(Array.isArray(set.images) ? set.images : []);

    if (!set.images || set.images.length === 0) {
      void fetchCollectionImages(set);
    }
  };

  const handleBack = () => {
    if (selectedSet) {
      setSelectedSet(null);
      setSelectedImageUrl(null);
      setCollectionImages([]);
      return;
    }
    if (drillDownParent) {
      setDrillDownParent(null);
    }
  };

  const handleApply = () => {
    if (!selectedImageUrl) return;
    onConfirm(selectedImageUrl);
    onOpenChange(false);
  };

  const renderCollections = () => {
    if (isLoadingSets) {
      return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      );
    }

    if (availableCollections.length === 0) {
      return (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed text-center text-sm text-muted-foreground">
          <p>No personal collections yet.</p>
          <p>Create one on the Image Collections page.</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-full max-h-full pr-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availableCollections.map((set) => {
            const previewImages = getPreviewImages(set);
            return (
              <div
                key={set.id}
                onClick={() => handleSelectCollection(set)}
                className="group cursor-pointer rounded-lg p-2 transition bg-card relative overflow-visible border border-transparent hover:border-muted-foreground/30"
              >
                <div className="mb-2 text-base font-medium text-foreground truncate">
                  {set.name}
                </div>
                {previewImages.length ? (
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-5 gap-0">
                      {previewImages.map((image, index) => (
                        <div
                          key={image.id ?? `${set.id}-${index}`}
                          className={cn(
                            "relative h-24 md:h-32 lg:h-40 overflow-hidden",
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
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  const renderImages = () => {
    if (!selectedSet) return null;

    if (isLoadingImages) {
      return (
        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-full rounded-md" />
          ))}
        </div>
      );
    }

    if (collectionImages.length === 0) {
      return (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed text-center text-sm text-muted-foreground">
          <p>No images in this collection yet.</p>
          <p>Upload images on the Image Collections page.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {collectionImages.map((image) => (
          <button
            key={image.id ?? image.url}
            onClick={() => setSelectedImageUrl(image.url)}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-lg border transition",
              selectedImageUrl === image.url
                ? "border-primary ring-2 ring-primary"
                : "border-transparent hover:border-muted-foreground/40",
            )}
          >
            <img
              src={image.url}
              alt={selectedSet.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
     !max-w-none
     w-[96vw] md:w-[70vw]
     h-[85vh] max-h-[85vh]
     p-0 overflow-hidden flex flex-col
     rounded-2xl shadow-xl border border-border/30
        "
      >
        <DialogHeader
          className="
            sticky top-0 z-10
            px-6 pt-6 pb-4 border-b
            bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
          "
        >
          <div className="flex items-center gap-2">
            {(selectedSet || drillDownParent) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-2xl">
              {selectedSet
                ? `Select image from ${selectedSet.name}`
                : drillDownParent
                  ? `Collections in ${drillDownParent.name}`
                  : "Personal Image Collections"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 overscroll-contain">
          {selectedSet ? renderImages() : renderCollections()}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/image-collections">Manage collections</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={!selectedImageUrl}>
              Apply Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
