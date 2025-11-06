"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { TikTokPostForm } from "@/components/tiktok/TikTokPostForm";
import { TikTokScheduleForm } from "@/components/tiktok/TikTokScheduleForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTikTokPostAction } from "@/hooks/use-tiktok-post-action";
import { useTikTokScheduleAction } from "@/hooks/use-tiktok-schedule-action";
import { useSlideshowPostState } from "@/states/slideshow-post-state";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function CreateSlideshowPostPage() {
  const router = useRouter();
  const prepared = useSlideshowPostState((state) => state.prepared);

  const postAction = useTikTokPostAction({
    defaultValues: {
      caption: "",
      title: "",
      photoImages: prepared?.slideImageUrls ?? [],
    },
  });
  const scheduleAction = useTikTokScheduleAction({
    defaultValues: {
      caption: "",
      title: "",
      photoImages: prepared?.slideImageUrls ?? [],
    },
  });
  const updatePostField = postAction.updateField;
  const updateScheduleField = scheduleAction.updateField;
  const { accounts, accountsLoading } = postAction;

  const slides = prepared?.slides ?? [];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(
    scheduleAction.form.publishAt ?? "",
  );
  const [finalizing, setFinalizing] = useState(false);
  const [finalizingMode, setFinalizingMode] = useState<"post" | "schedule" | null>(null);
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
    updatePostField("coverIndex", 0);
    updateScheduleField("coverIndex", 0);
    if (!scheduledAt) {
      setScheduledAt(scheduleAction.form.publishAt ?? "");
    }
  }, [prepared, updatePostField, updateScheduleField]);

  useEffect(() => {
    setScheduledAt(scheduleAction.form.publishAt ?? "");
  }, [scheduleAction.form.publishAt]);

  const isPosting = postAction.submitting;
  const isScheduling = scheduleAction.submitting;

  const handlePrimaryAction = async () => {
    if (scheduleEnabled && !scheduledAt) {
      return;
    }

    const mode: "post" | "schedule" = scheduleEnabled ? "schedule" : "post";
    setFinalizing(true);
    setFinalizingMode(mode);

    let redirected = false;
    try {
      if (mode === "schedule") {
        const result = await scheduleAction.handleSubmit();
        if (result?.scheduled) {
          redirected = true;
          router.push("/dashboard/posts/scheduled");
        }
      } else {
        const result = await postAction.handleSubmit();
        if (result && (result.status === "inbox" || result.status === "success")) {
          redirected = true;
          router.push("/dashboard/posts/posted");
        }
      }
    } catch (error) {
      console.error("[CreateSlideshowPostPage] Submission failed", error);
    } finally {
      if (!redirected) {
        setFinalizing(false);
        setFinalizingMode(null);
      }
    }
  };

  const handleToggleSchedule = (checked: boolean) => {
    setScheduleEnabled(checked);
    if (checked) {
      const publishAt = scheduleAction.form.publishAt ?? scheduledAt ?? "";
      if (publishAt) {
        setScheduledAt(publishAt);
        updateScheduleField("publishAt", publishAt);
      }
    }
  };

  const handleScheduledAtChange = (value: string) => {
    setScheduledAt(value);
    updateScheduleField("publishAt", value);
  };

  const handleSelectAccount = (openId: string) => {
    updatePostField("openId", openId);
    updateScheduleField("openId", openId);
  };

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

  if (!prepared) {
    return fallbackContent;
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Create Slideshow Post</h1>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-lg">
            <div className="flex items-start gap-3 p-4">
              <div className="flex gap-4 overflow-x-auto pb-1">
                {accountsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading accounts…
                  </p>
                ) : accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No TikTok accounts connected.
                  </p>
                ) : (
                  accounts.map((account) => {
                    const label =
                      account.username ?? account.displayName ?? account.openId;
                    const isSelected =
                      postAction.form.openId === account.openId;
                    const initials = label
                      .split(" ")
                      .map((part) => part[0]?.toUpperCase())
                      .join("")
                      .slice(0, 2);

                    return (
                      <button
                        key={account.openId}
                        type="button"
                        onClick={() => handleSelectAccount(account.openId)}
                        className="flex flex-col items-center gap-2"
                        aria-pressed={isSelected}
                      >
                        <span
                          className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all ${isSelected ? "border-blue-500" : "border-border"}`}
                        >
                          {account.avatarUrl ? (
                            <img
                              src={account.avatarUrl}
                              alt={label}
                              className={`h-14 w-14 rounded-full object-cover transition-all ${isSelected ? "" : "grayscale opacity-70"}`}
                            />
                          ) : (
                            <span
                              className={`flex h-14 w-14 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground transition-all ${isSelected ? "text-primary" : ""}`}
                            >
                              {initials || "TikTok"}
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-xs ${isSelected ? "font-semibold" : "text-muted-foreground"}`}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <TikTokPostForm
            action={postAction}
            cardTitle="Post configuration"
            submitLabel="Trigger TikTok post"
            refreshLabel="Refresh accounts"
            showSubmitButton={false}
            showRefreshButton={false}
            renderAccountSelector={false}
          />
          {scheduleEnabled && (
            <TikTokScheduleForm
              action={scheduleAction}
              cardTitle="Schedule configuration"
              submitLabel="Schedule TikTok post"
              refreshLabel="Refresh accounts"
              showSubmitButton={false}
              showRefreshButton={false}
              showPublishControls={false}
              renderAccountSelector={false}
              onSelectAccount={handleSelectAccount}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <aside className="flex flex-col rounded-lg border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="text-lg font-semibold">Media Preview</h2>
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
          <aside className="flex flex-col rounded-lg border bg-card">
            <div className="flex flex-col gap-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Schedule post</p>
                  <p className="text-xs text-muted-foreground">
                    Enable to pick a publish date and time.
                  </p>
                </div>
                <Switch
                  checked={scheduleEnabled}
                  onCheckedChange={handleToggleSchedule}
                  aria-label="Toggle scheduling"
                />
              </div>

              {scheduleEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Publish at</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) =>
                      handleScheduledAtChange(event.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Times are sent in UTC.
                  </p>
                </div>
              )}

              <Button
                size="lg"
                onClick={() => void handlePrimaryAction()}
                disabled={
                  isPosting ||
                  isScheduling ||
                  accountsLoading ||
                  accounts.length === 0 ||
                  !postAction.form.openId ||
                  finalizing ||
                  (scheduleEnabled && !scheduledAt) ||
                  postAction.form.photoImages.length === 0
                }
              >
                {scheduleEnabled
                  ? isScheduling
                    ? "Scheduling…"
                    : "Schedule Now"
                  : isPosting
                    ? "Posting…"
                    : "Post Now"}
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {finalizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur">
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-5 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {finalizingMode === "schedule"
                ? "Scheduling TikTok post…"
                : "Posting to TikTok…"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
