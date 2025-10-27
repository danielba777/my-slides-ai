"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type UserImage = { id: string; url: string; createdAt: string };

export default function PersonalImageSelectorDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (imageUrl: string) => void;
}) {
  const [tab, setTab] = useState<"upload" | "mine">("mine");
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const loadImages = async () => {
    const res = await fetch("/api/user-images/list", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { images: UserImage[] };
    setImages(data.images ?? []);
  };

  useEffect(() => {
    if (open) loadImages();
  }, [open]);

  const onUpload = async () => {
    if (!files || files.length === 0) return;
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    setIsUploading(true);
    try {
      const res = await fetch("/api/user-images/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      await loadImages();
      setTab("mine");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>My Images</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mine">My Images</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[60vh] overflow-auto">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedUrl(img.url)}
                  className={cn(
                    "relative aspect-[4/5] overflow-hidden rounded-md border",
                    selectedUrl === img.url ? "ring-2 ring-primary border-primary" : "border-transparent"
                  )}
                  aria-label="Select image"
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              {images.length === 0 && (
                <div className="col-span-full text-center text-sm text-muted-foreground py-10">
                  No images uploaded yet.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div className="space-y-3">
              <Input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.currentTarget.files)} />
              <Button onClick={onUpload} disabled={isUploading || !files || files.length === 0}>
                {isUploading ? "Uploading..." : "Start upload"}
              </Button>
              <p className="text-xs text-muted-foreground">Supported: JPG, PNG, WEBP. Multiple files allowed.</p>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => selectedUrl && onConfirm(selectedUrl)} disabled={!selectedUrl}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}