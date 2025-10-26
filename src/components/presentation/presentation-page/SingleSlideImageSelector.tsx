"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ImageSetImage {
  id?: string;
  url: string;
}

interface ImageSet {
  id: string;
  name: string;
  category?: string;
  images?: ImageSetImage[];
  _count?: { images: number; children?: number };
  isOwnedByUser?: boolean;
  parentId?: string | null;
  children?: ImageSet[];
}

interface SingleSlideImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

export function SingleSlideImageSelector({
  isOpen,
  onClose,
  onSelectImage,
}: SingleSlideImageSelectorProps) {
  const [selectedSet, setSelectedSet] = useState<ImageSet | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [imageSets, setImageSets] = useState<ImageSet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"community" | "mine">("community");
  const [currentPage, setCurrentPage] = useState(1);

  // Drill-down navigation state
  const [drillDownParent, setDrillDownParent] = useState<ImageSet | null>(null);

  const IMAGES_PER_PAGE = 27; // 9 columns x 3 rows

  const loadImageSets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/imagesets");
      if (!response.ok) {
        throw new Error("Failed to fetch image sets");
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setImageSets(data);
      } else {
        setImageSets([]);
      }
    } catch (error) {
      console.error("Error loading image sets:", error);
      setImageSets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void loadImageSets();
      setPendingImageUrl(null);
      setSelectedSet(null);
      setCurrentPage(1);
      setDrillDownParent(null); // Reset drill-down when opening dialog
    }
  }, [isOpen, loadImageSets]);

  // Reset page when changing selected set
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSet]);

  const { communitySets, mySets } = useMemo(() => {
    // If drilling down, show only children of selected parent
    if (drillDownParent) {
      const children = drillDownParent.children || [];
      const community: ImageSet[] = [];
      const mine: ImageSet[] = [];

      children.forEach((set) => {
        const category = set.category?.toLowerCase() ?? "";
        const isMine =
          Boolean(set.isOwnedByUser) ||
          category === "personal" ||
          category === "mine" ||
          category === "user";

        if (isMine) {
          mine.push(set);
        } else {
          community.push(set);
        }
      });

      return { communitySets: community, mySets: mine };
    }

    // Otherwise show top-level sets
    const community: ImageSet[] = [];
    const mine: ImageSet[] = [];
    const topLevelSets = imageSets.filter((set) => !set.parentId);

    topLevelSets.forEach((set) => {
      const category = set.category?.toLowerCase() ?? "";
      const isMine =
        Boolean(set.isOwnedByUser) ||
        category === "personal" ||
        category === "mine" ||
        category === "user";

      if (isMine) {
        mine.push(set);
      } else {
        community.push(set);
      }
    });

    return { communitySets: community, mySets: mine };
  }, [imageSets, drillDownParent]);

  const handleSelectImage = (imageUrl: string) => {
    setPendingImageUrl(imageUrl);
  };

  const handleSave = () => {
    if (pendingImageUrl) {
      onSelectImage(pendingImageUrl);
      onClose();
    }
  };

  const handleSelectSet = (set: ImageSet) => {
    // Check if this set has children
    const hasChildren =
      (set.children && set.children.length > 0) ||
      (set._count?.children && set._count.children > 0);

    if (hasChildren) {
      // Drill down to show only children
      setDrillDownParent(set);
    } else {
      // Directly select this set for image browsing
      setSelectedSet(set);
    }
  };

  const handleBackToTopLevel = () => {
    setDrillDownParent(null);
  };

  const getPreviewImages = (set: ImageSet): ImageSetImage[] => {
    // If this set has its own images, use them
    if (Array.isArray(set.images) && set.images.length > 0) {
      return set.images.slice(0, 5);
    }

    // If this set has children but no own images, use mixed preview
    if (set.children && set.children.length > 0) {
      return getMixedPreviewImages(set);
    }

    return [];
  };

  const getMixedPreviewImages = (parent: ImageSet): ImageSetImage[] => {
    // Create a mixed preview from all children
    if (!parent.children || parent.children.length === 0) {
      // Fallback: use parent's own images if available
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
      // If no children have images, use parent's own images if available
      if (Array.isArray(parent.images) && parent.images.length > 0) {
        return parent.images.slice(0, 5);
      }
      return [];
    }

    // Distribute images evenly across children (round-robin)
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

      // Break if we've exhausted all images
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
      return (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          {emptyLabel}
        </div>
      );
    }

    return (
      <ScrollArea className="h-full max-h-full pr-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* "All Images" Option when drilling down */}
          {drillDownParent && (
            <div
              key="all-images"
              onClick={() => setSelectedSet(drillDownParent)}
              className="group cursor-pointer rounded-lg p-2 transition bg-card relative overflow-visible border border-transparent hover:border-muted-foreground/30"
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
                          <img
                            src={image.url}
                            alt={`All images preview ${index + 1}`}
                            className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                            loading="lazy"
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

          {/* Regular image sets */}
          {sets.map((set) => {
            const previewImages = getPreviewImages(set);

            return (
              <div
                key={set.id}
                onClick={() => handleSelectSet(set)}
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

  const renderImageSelection = () => {
    if (!selectedSet) return null;

    // Collect all images: either from this set or from all children
    let allImages: ImageSetImage[] = [];

    if (Array.isArray(selectedSet.images) && selectedSet.images.length > 0) {
      // Use own images if available
      allImages = selectedSet.images;
    } else if (selectedSet.children && selectedSet.children.length > 0) {
      // Collect images from all children
      selectedSet.children.forEach((child) => {
        if (Array.isArray(child.images)) {
          allImages.push(...child.images);
        }
      });
    }

    if (allImages.length === 0) return null;

    const totalImages = allImages.length;
    const totalPages = Math.ceil(totalImages / IMAGES_PER_PAGE);
    const startIndex = (currentPage - 1) * IMAGES_PER_PAGE;
    const endIndex = startIndex + IMAGES_PER_PAGE;
    const currentImages = allImages.slice(startIndex, endIndex);

    return (
      <>
        <div className="flex-1 overflow-auto">
          <div className="grid gap-3 grid-cols-9 auto-rows-fr p-4">
            {currentImages.map((img, idx) => (
              <button
                key={img.id ?? startIndex + idx}
                onClick={() => handleSelectImage(img.url)}
                className={cn(
                  "aspect-square rounded-lg overflow-hidden transition-all relative",
                  "hover:ring-2 hover:ring-blue-400 hover:scale-105",
                  pendingImageUrl === img.url &&
                    "ring-4 ring-blue-500 scale-105",
                )}
              >
                <img
                  src={img.url}
                  alt={`${selectedSet.name} ${startIndex + idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {pendingImageUrl === img.url && (
                  <div className="absolute inset-0 bg-blue-500/20" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          w-[92vw] sm:w-[900px] lg:w-[1000px]
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
                onClick={() => {
                  if (selectedSet) {
                    setSelectedSet(null);
                    setPendingImageUrl(null);
                  } else if (drillDownParent) {
                    handleBackToTopLevel();
                  }
                }}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-2xl">
              {selectedSet
                ? `Select Image from ${selectedSet.name}`
                : drillDownParent
                  ? `Select from: ${drillDownParent.name}`
                  : "Select Image Collection"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Scrollbarer Mittelteil */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 overscroll-contain">
          {selectedSet ? (
            <div className="mt-2">
              {renderImageSelection()}
            </div>
          ) : (
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
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {selectedSet && (
            <Button onClick={handleSave} disabled={!pendingImageUrl}>
              Apply Image
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
