"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  annotateImageSetOwnership,
  isImageSetOwnedByUser as checkOwnership,
  hasPersonalCategoryTag,
} from "@/lib/image-set-ownership";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ImageSetImage {
  id?: string;
  url: string;
}

interface ImageSet {
  id: string;
  name: string;
  category?: string;
  slug?: string | null;
  images?: ImageSetImage[];
  _count?: { images: number; children?: number };
  isOwnedByUser?: boolean;
  parentId?: string | null;
  children?: ImageSet[];
}

export const ImageCollectionSelector: React.FC = () => {
  const { imageSetId, setImageSetId, setImageSource } = usePresentationState();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingSetId, setPendingSetId] = useState<string | null>(null);
  const [imageSets, setImageSets] = useState<ImageSet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"community" | "mine">("community");
  const [allOwned, setAllOwned] = useState<Set<string>>(new Set());

  
  const [drillDownParent, setDrillDownParent] = useState<ImageSet | null>(null);

  const loadImageSets = useCallback(async () => {
    try {
      setIsLoading(true);
      const [setsRes, ownedRes, allRes] = await Promise.all([
        fetch("/api/imagesets", { cache: "no-store" }),
        fetch("/api/user-image-collections", { cache: "no-store" }),
        fetch("/api/user-image-collections/all", { cache: "no-store" }),
      ]);

      if (!setsRes.ok) {
        throw new Error("Failed to fetch image sets");
      }

      const data = (await setsRes.json()) as unknown;
      const ownedPayload = ownedRes.ok ? await ownedRes.json() : null;
      const ownedIds = new Set<string>(ownedPayload?.ownedIds ?? []);
      const allPayload = allRes.ok ? await allRes.json() : null;
      const allOwnedIds = new Set<string>(allPayload?.allOwnedIds ?? []);
      setAllOwned(allOwnedIds);

      if (Array.isArray(data)) {
        const normalized = data.map((set: ImageSet) =>
          annotateImageSetOwnership(set, userId, ownedIds.has(set.id)),
        );
        setImageSets(normalized);
      } else {
        setImageSets([]);
      }
    } catch (error) {
      console.error("Error loading image sets:", error);
      setImageSets([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadImageSets();
  }, [loadImageSets]);

  useEffect(() => {
    if (isDialogOpen) {
      setPendingSetId(imageSetId ?? null);
      setDrillDownParent(null); 
    }
  }, [isDialogOpen, imageSetId]);

  const selectedImageSet = useMemo(
    () => imageSets.find((set) => set.id === imageSetId) ?? null,
    [imageSets, imageSetId],
  );

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

  
  const looksPersonal = useCallback(
    (set: ImageSet) =>
      hasPersonalCategoryTag(set.category) ||
      hasPersonalCategoryTag(set.slug) ||
      hasPersonalCategoryTag(set.name),
    [],
  );

  
  const belongsToUser = useCallback(
    (set: ImageSet) =>
      checkOwnership(set, userId ?? null) || isAiAvatarCollection(set),
    [isAiAvatarCollection, userId],
  );

  const availableCollections = useMemo(() => {
    
    if (!drillDownParent) {
      
      return imageSets
        .filter((set) => !set.parentId)
        .filter(belongsToUser)
        .filter((s) => !looksPersonal(s) || checkOwnership(s, userId ?? null));
    }

    const parentId = (drillDownParent as { id?: string | number })?.id;
    const inlineChildren = Array.isArray((drillDownParent as any).children)
      ? ((drillDownParent as any).children as ImageSet[])
      : undefined;

    const children: ImageSet[] =
      (inlineChildren && inlineChildren.length > 0
        ? inlineChildren
        : typeof parentId !== "undefined"
          ? imageSets.filter((set) => set.parentId === parentId)
          : []) ?? [];

    return children
      .filter(belongsToUser)
      .filter((s) => !looksPersonal(s) || checkOwnership(s, userId ?? null));
  }, [
    belongsToUser,
    imageSets,
    drillDownParent,
    looksPersonal,
    userId,
    checkOwnership,
  ]);

  const { communitySets, mySets } = useMemo(() => {
    
    if (drillDownParent) {
      const parentId = drillDownParent?.id ?? null;
      const children: ImageSet[] =
        Array.isArray(drillDownParent.children) &&
        drillDownParent.children.length > 0
          ? drillDownParent.children
          : parentId
            ? imageSets.filter((set) => set.parentId === parentId)
            : [];

      const mine = children.filter(belongsToUser);
      const community = children.filter(
        (s) =>
          
          !allOwned.has(s.id) &&
          
          !looksPersonal(s) &&
          
          !isAiAvatarCollection(s),
      );
      return { communitySets: community, mySets: mine };
    }

    
    const topLevel = imageSets.filter((s) => !s.parentId);
    const mine = topLevel.filter(belongsToUser);
    const community = topLevel.filter(
      (s) =>
        !allOwned.has(s.id) && !looksPersonal(s) && !isAiAvatarCollection(s),
    );
    return { communitySets: community, mySets: mine };
  }, [
    belongsToUser,
    drillDownParent,
    imageSets,
    allOwned,
    looksPersonal,
    isAiAvatarCollection,
  ]);

  const handleSelectSet = (set: ImageSet) => {
    
    const hasChildren =
      (set.children && set.children.length > 0) ||
      (set._count?.children && set._count.children > 0);

    if (hasChildren) {
      
      setDrillDownParent(set);
    } else {
      
      setPendingSetId(set.id);
    }
  };

  const handleBackToTopLevel = () => {
    setDrillDownParent(null);
  };

  const handleSave = () => {
    if (pendingSetId) {
      setImageSetId(pendingSetId);
      setImageSource("imageset");
      setIsDialogOpen(false);
    }
  };

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
      
      if (Array.isArray(parent.images) && parent.images.length > 0) {
        return parent.images.slice(0, 5);
      }
      return [];
    }

    const mixedImages: ImageSetImage[] = [];
    const childrenWithImages = parent.children.filter(
      (child) => Array.isArray(child.images) && child.images.length > 0,
    );

    if (childrenWithImages.length === 0) {
      
      if (Array.isArray(parent.images) && parent.images.length > 0) {
        return parent.images.slice(0, 5);
      }
      return [];
    }

    
    let childIndex = 0;
    while (
      mixedImages.length < 5 &&
      childIndex < childrenWithImages.length * 10
    ) {
      const childIdx = childIndex % childrenWithImages.length;
      const child = childrenWithImages[childIdx];

      if (!child) {
        childIndex++;
        continue;
      }

      const imageIndex = Math.floor(childIndex / childrenWithImages.length);

      if (child.images && imageIndex < child.images.length) {
        const image = child.images[imageIndex];
        if (image) {
          mixedImages.push(image);
        }
      }

      childIndex++;

      
      if (childIndex >= childrenWithImages.length * 10) break;
    }

    return mixedImages.slice(0, 5);
  };

  const renderImageSetGrid = (sets: ImageSet[], emptyLabel: string) => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      );
    }

    if (!sets.length && !drillDownParent) {
      return null; 
    }

    return (
      <ScrollArea className="h-full max-h-full pr-0 scrollbar-hide">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {}
          {drillDownParent && (
            <div
              key="all-images"
              onClick={() => setPendingSetId(drillDownParent.id)}
              className={cn(
                "group cursor-pointer rounded-lg p-2 transition bg-card relative overflow-visible",
                pendingSetId === drillDownParent.id
                  ? "border-2 border-blue-500"
                  : "border-2 border-transparent hover:border-muted-foreground/30",
              )}
            >
              <div className="mb-2 text-base font-bold text-foreground">
                ✨ All Images
              </div>
              {(() => {
                const allImagesPreview = getMixedPreviewImages(drillDownParent);
                return allImagesPreview.length ? (
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-5 gap-0">
                      {allImagesPreview.map((image, index) => (
                        <div
                          key={image.id ?? `all-${index}`}
                          className={cn(
                            "relative h-24 md:h-32 lg:h-40 overflow-hidden",
                            index === 0 && "rounded-l-lg",
                            index === allImagesPreview.length - 1 &&
                              "rounded-r-lg",
                          )}
                        >
                          <Image
                            src={image.url}
                            alt={`All images preview ${index + 1}`}
                            width={320}
                            height={320}
                            className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                            quality={50}
                            loading="lazy"
                            sizes="(max-width: 640px) 120px, (max-width: 1024px) 160px, 200px"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Use all images from all subfolders
                  </div>
                );
              })()}
            </div>
          )}

          {}
          {sets.map((set) => {
            const previewImages = getPreviewImages(set);

            return (
              <div
                key={set.id}
                onClick={() => handleSelectSet(set)}
                className={cn(
                  "group cursor-pointer rounded-lg p-2 transition bg-card relative overflow-visible",
                  pendingSetId === set.id
                    ? "border-2 border-blue-500"
                    : "border-2 border-transparent hover:border-muted-foreground/30",
                )}
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
                          <Image
                            src={image.url}
                            alt={`${set.name} preview ${index + 1}`}
                            width={320}
                            height={320}
                            className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                            quality={50}
                            loading="lazy"
                            sizes="(max-width: 640px) 120px, (max-width: 1024px) 160px, 200px"
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

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-foreground">2. Images</label>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="w-full rounded-lg border border-border bg-card p-4 text-left text-sm text-muted-foreground transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {selectedImageSet ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">
                  {selectedImageSet.name}
                </span>
                <div className="overflow-hidden">
                  <div className="grid grid-cols-5 gap-0">
                    {getPreviewImages(selectedImageSet).map(
                      (image, index, arr) => (
                        <div
                          key={image.id ?? `${selectedImageSet.id}-${index}`}
                          className={cn(
                            "relative h-24 md:h-32 lg:h-40 overflow-hidden",
                            index === 0 && "rounded-l-lg",
                            index === arr.length - 1 && "rounded-r-lg",
                          )}
                        >
                          <Image
                            src={image.url}
                            alt={`${selectedImageSet.name} preview ${index + 1}`}
                            width={320}
                            height={320}
                            className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                            quality={50}
                            loading="lazy"
                            sizes="(max-width: 640px) 120px, (max-width: 1024px) 160px, 200px"
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">
                  No image set selected
                </span>
                <div className="h-24 md:h-32 lg:h-40 w-full rounded-lg bg-muted" />
              </div>
            )}
          </button>
        </DialogTrigger>
        <DialogContent
          className="
     !max-w-none                 /* überschreibt jedes max-w aus dem Component-Default */
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
            <div className="flex items-center gap-4">
              {drillDownParent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToTopLevel}
                  className="gap-2"
                >
                  ← Back
                </Button>
              )}
              <DialogTitle className="text-2xl">
                {drillDownParent
                  ? `Select from: ${drillDownParent.name}`
                  : "Select Image Collection"}
              </DialogTitle>
            </div>
          </DialogHeader>

          {}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 overscroll-contain scrollbar-hide">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "community" | "mine")
              }
              className="flex flex-col min-h-0"
            >
              <TabsList className="grid w-full grid-cols-2 rounded-lg bg-muted p-1">
                <TabsTrigger
                  value="community"
                  className="w-full rounded-md text-muted-foreground transition data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Community
                </TabsTrigger>
                <TabsTrigger
                  value="mine"
                  className="w-full rounded-md text-muted-foreground transition data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  My Collections
                </TabsTrigger>
              </TabsList>
              <TabsContent value="community" className="mt-4 min-h-0">
                {renderImageSetGrid(
                  communitySets,
                  "No community collections available yet.",
                )}
              </TabsContent>
              <TabsContent value="mine" className="mt-4 min-h-0">
                {renderImageSetGrid(
                  mySets,
                  "You haven't created any collections yet.",
                )}
              </TabsContent>
            </Tabs>
          </div>

          {}
          <div
            className="
              shrink-0 border-t
              px-6 py-4
              bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
              flex items-center justify-end gap-2
            "
          >
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!pendingSetId}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
