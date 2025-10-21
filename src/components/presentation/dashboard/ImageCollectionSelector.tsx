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
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
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
  _count?: { images: number };
  isOwnedByUser?: boolean;
}

export function ImageCollectionSelector(): JSX.Element {
  const { imageSetId, setImageSetId, setImageSource } = usePresentationState();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingSetId, setPendingSetId] = useState<string | null>(null);
  const [imageSets, setImageSets] = useState<ImageSet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"community" | "mine">("community");

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
    void loadImageSets();
  }, [loadImageSets]);

  useEffect(() => {
    if (isDialogOpen) {
      setPendingSetId(imageSetId ?? null);
    }
  }, [isDialogOpen, imageSetId]);

  const selectedImageSet = useMemo(
    () => imageSets.find((set) => set.id === imageSetId) ?? null,
    [imageSets, imageSetId],
  );

  const { communitySets, mySets } = useMemo(() => {
    const community: ImageSet[] = [];
    const mine: ImageSet[] = [];

    imageSets.forEach((set) => {
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
  }, [imageSets]);

  const handleSelectSet = (set: ImageSet) => {
    setPendingSetId(set.id);
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
    return [];
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

    if (!sets.length) {
      return null; // Wenn keine Sets vorhanden sind, nichts anzeigen
    }

    return (
      <ScrollArea className="h-full max-h-full pr-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                    : "border border-transparent hover:border-muted-foreground/30",
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
                          <img
                            src={image.url}
                            alt={`${selectedImageSet.name} preview ${index + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
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
        <DialogContent className="max-w-7xl min-h-[700px] flex flex-col justify-start items-stretch">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Select Image Collection
            </DialogTitle>
          </DialogHeader>
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "community" | "mine")
            }
            className="mt-4 flex flex-col flex-1"
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
            <TabsContent
              value="community"
              className="mt-4 flex-1 overflow-hidden"
            >
              {renderImageSetGrid(
                communitySets,
                "No community collections available yet.",
              )}
            </TabsContent>
            <TabsContent value="mine" className="mt-4 flex-1 overflow-hidden">
              {renderImageSetGrid(
                mySets,
                "You haven't created any collections yet.",
              )}
            </TabsContent>
          </Tabs>
          <div className="mt-auto flex items-center justify-end gap-2 pt-4">
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
}
