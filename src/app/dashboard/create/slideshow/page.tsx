"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { TikTokPostForm } from "@/components/tiktok/TikTokPostForm";
import { TikTokScheduleForm } from "@/components/tiktok/TikTokScheduleForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTikTokPostAction } from "@/hooks/use-tiktok-post-action";
import { useTikTokScheduleAction } from "@/hooks/use-tiktok-schedule-action";
import { useSlideshowPostState } from "@/states/slideshow-post-state";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CreateSlideshowPostPage() {
  const router = useRouter();
  const prepared = useSlideshowPostState((state) => state.prepared);

  const postAction = useTikTokPostAction({
    defaultValues: {
      caption: prepared?.defaultCaption ?? "",
      title: prepared?.presentationTitle ?? "",
      photoImages: prepared?.slideImageUrls ?? [],
    },
  });
  const scheduleAction = useTikTokScheduleAction({
    defaultValues: {
      caption: prepared?.defaultCaption ?? "",
      title: prepared?.presentationTitle ?? "",
      photoImages: prepared?.slideImageUrls ?? [],
    },
  });
  const updatePostField = postAction.updateField;
  const updateScheduleField = scheduleAction.updateField;

  const presentationId = prepared?.presentationId ?? null;
  const presentationTitle = prepared?.presentationTitle ?? "Slideshow";

  const slides = prepared?.slides ?? [];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length === 0) {
      setCurrentSlide(0);
      return;
    }
    setCurrentSlide((prev) => Math.min(prev, slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    if (!prepared) return;
    updatePostField("photoImages", prepared.slideImageUrls ?? []);
    updateScheduleField("photoImages", prepared.slideImageUrls ?? []);
    updatePostField("title", prepared.presentationTitle ?? "");
    updateScheduleField("title", prepared.presentationTitle ?? "");
    updatePostField("caption", prepared.defaultCaption ?? "");
    updateScheduleField("caption", prepared.defaultCaption ?? "");
    updatePostField("coverIndex", 0);
    updateScheduleField("coverIndex", 0);
  }, [prepared, updatePostField, updateScheduleField]);

  const fallbackContent = (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Create Slideshow Post</h1>
        <p className="text-muted-foreground">
          No prepared slides found. Export the slideshow in the editor and try
          again.
        </p>
      </div>
      <Button onClick={() => router.push("/dashboard/slideshows")}>
        Back to slideshows
      </Button>
    </div>
  );

  const backTarget = useMemo(() => {
    if (presentationId) {
      return `/dashboard/slideshows/${presentationId}`;
    }
    return "/dashboard/slideshows";
  }, [presentationId]);

  if (!prepared) {
    return fallbackContent;
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Create Slideshow Post</h1>
          <p className="text-muted-foreground">
            Export your slideshow, then publish or schedule it for TikTok.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => router.push(backTarget)}>
            Back to slideshow
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <Tabs defaultValue="post" className="w-full">
            <TabsList className="w-full max-w-md">
              <TabsTrigger value="post" className="flex-1">
                Post now
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex-1">
                Schedule
              </TabsTrigger>
            </TabsList>
            <TabsContent value="post" className="mt-6">
              <TikTokPostForm
                action={postAction}
                cardTitle="Post configuration"
                submitLabel="Trigger TikTok post"
                refreshLabel="Refresh accounts"
              />
            </TabsContent>
            <TabsContent value="schedule" className="mt-6">
              <TikTokScheduleForm
                action={scheduleAction}
                cardTitle="Schedule configuration"
                submitLabel="Schedule TikTok post"
                refreshLabel="Refresh accounts"
              />
            </TabsContent>
          </Tabs>
        </section>

        <aside className="flex flex-col rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-lg font-semibold">Slideshow Preview</h2>
            <p className="text-sm text-muted-foreground">
              Preview of the exported slides ({slides.length} total).
            </p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
            {slides.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                No slides available. Return to the editor and export the
                slideshow again.
              </p>
            ) : (
              <>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                    size="icon"
                    onClick={() =>
                      setCurrentSlide(
                        (currentSlide - 1 + slides.length) % slides.length,
                      )
                    }
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </Button>
                  <div className="relative aspect-[2/3] w-56 overflow-hidden rounded-lg border border-border/70 sm:w-64">
                    <Image
                      src={slides[currentSlide]?.dataUrl ?? ""}
                      alt={`Slide ${currentSlide + 1}`}
                      fill
                      className="object-cover"
                      sizes="256px"
                      unoptimized
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setCurrentSlide((currentSlide + 1) % slides.length)
                    }
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Slide {currentSlide + 1} of {slides.length}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {slides.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        aria-label={`Show slide ${index + 1}`}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-2.5 w-2.5 rounded-full transition-colors ${index === currentSlide ? "bg-primary" : "bg-border"}`}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
