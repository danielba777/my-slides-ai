"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { TikTokPostForm } from "@/components/tiktok/TikTokPostForm";
import { TikTokScheduleForm } from "@/components/tiktok/TikTokScheduleForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTikTokDirectPost } from "@/hooks/use-tiktok-direct-post";
import { useTikTokScheduleAction } from "@/hooks/use-tiktok-schedule-action";
import { useSlideshowPostState } from "@/states/slideshow-post-state";
import { useTikTokAccounts } from "@/hooks/use-tiktok-accounts";
import { TikTokPostingLoader } from "@/components/tiktok/TikTokPostingLoader";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const MUSIC_USAGE_URL = "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en";
const BRANDED_CONTENT_URL = "https://www.tiktok.com/legal/page/global/bc-policy/en";

export default function CreateSlideshowPostPage() {
  const router = useRouter();
  const prepared = useSlideshowPostState((state) => state.prepared);

  // Use the new direct post hook
  const directPostAction = useTikTokDirectPost({
    defaultValues: {
      caption: "",
      title: "",
      photoImages: prepared?.slideImageUrls ?? [],
    },
  });

  // Keep schedule action for scheduling functionality
  const scheduleAction = useTikTokScheduleAction({
    defaultValues: {
      caption: "",
      title: "",
      photoImages: prepared?.slideImageUrls ?? [],
    },
  });

  // Get accounts from separate hook
  const { accounts, loading: accountsLoading, refresh: refreshAccounts } = useTikTokAccounts();

  const updateDirectPostField = directPostAction.updateField;
  const updateScheduleField = scheduleAction.updateField;

  const slides = prepared?.slides ?? [];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(
    scheduleAction.form.publishAt ?? "",
  );
  const [finalizing, setFinalizing] = useState(false);
  const [finalizingMode, setFinalizingMode] = useState<"post" | "schedule" | null>(null);
  const [postingData, setPostingData] = useState<{
    publishId: string;
    caption: string;
  } | null>(null);
  const [tiktokMetadata, setTiktokMetadata] = useState<any>(null);

  // Check if metadata is valid (privacy level selected)
  const [isMetadataValid, setIsMetadataValid] = useState(true);
  const [privacySelectionMissing, setPrivacySelectionMissing] = useState(true);
  const [brandDisclosureMissing, setBrandDisclosureMissing] = useState(false);

  const missingPreparationToastShown = useRef(false);
  const noAccountsToastShown = useRef(false);
  const noSlidesToastShown = useRef(false);

  // Update metadata validity when global state changes
  useEffect(() => {
    const checkMetadataStatus = () => {
      let privacyMissing = true;
      let needsDisclosure = false;
      let metadata: any = null;

      if (typeof window !== "undefined") {
        const globalWindow = window as any;
        metadata = globalWindow.__tiktokMetadata ?? null;
        privacyMissing = !(metadata && metadata.privacyLevel);
        needsDisclosure = Boolean(metadata?.isCommercialContent && !metadata?.brandOption);
      }

      setTiktokMetadata(metadata);
      setPrivacySelectionMissing(privacyMissing);
      setBrandDisclosureMissing(needsDisclosure);
      setIsMetadataValid(!privacyMissing && !needsDisclosure);
    };

    checkMetadataStatus();
    // Set up interval to check for changes
    const interval = setInterval(checkMetadataStatus, 100);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!prepared && !missingPreparationToastShown.current) {
      toast.error("No prepared slides found. Export the slideshow again to continue.");
      missingPreparationToastShown.current = true;
      router.replace("/dashboard/slideshows");
    } else if (prepared) {
      missingPreparationToastShown.current = false;
    }
  }, [prepared, router]);

  useEffect(() => {
    if (slides.length === 0) {
      setCurrentSlide(0);
      if (prepared && !noSlidesToastShown.current) {
        toast.error("No slides available for this slideshow. Please export from the editor again.");
        noSlidesToastShown.current = true;
      }
      return;
    }
    noSlidesToastShown.current = false;
    setCurrentSlide((prev) => Math.min(prev, slides.length - 1));
  }, [prepared, slides.length]);

  useEffect(() => {
    if (!accountsLoading && accounts.length === 0 && !noAccountsToastShown.current) {
      toast.error("No TikTok accounts connected. Connect one before posting.");
      noAccountsToastShown.current = true;
    }
    if (accounts.length > 0) {
      noAccountsToastShown.current = false;
    }
  }, [accounts, accountsLoading]);

  useEffect(() => {
    if (!prepared) return;
    updateDirectPostField("photoImages", prepared.slideImageUrls ?? []);
    updateScheduleField("photoImages", prepared.slideImageUrls ?? []);
    if (!scheduledAt) {
      setScheduledAt(scheduleAction.form.publishAt ?? "");
    }
  }, [prepared, updateDirectPostField, updateScheduleField]);

  useEffect(() => {
    setScheduledAt(scheduleAction.form.publishAt ?? "");
  }, [scheduleAction.form.publishAt]);

  const isPosting = directPostAction.submitting;
  const isScheduling = scheduleAction.submitting;
  const captionMissing = !directPostAction.form.caption.trim();
  const primaryActionLabel = scheduleEnabled
    ? isScheduling
      ? "Scheduling…"
      : "Schedule Now"
    : isPosting
      ? "Posting…"
      : "Post Now";
  const primaryActionDisabledReason = (() => {
    if (finalizing) return "Finishing up your previous action. Please wait.";
    if (isPosting) return "Posting in progress…";
    if (isScheduling) return "Scheduling in progress…";
    if (accountsLoading) return "Loading TikTok accounts…";
    if (accounts.length === 0) return "Connect at least one TikTok account.";
    if (!directPostAction.form.openId) return "Select a TikTok account before posting.";
    if (directPostAction.form.photoImages.length === 0) return "Add at least one slide image.";
    if (captionMissing) return "Please enter a caption before posting.";
    if (scheduleEnabled && !scheduledAt) return "Choose when to publish this scheduled post.";
    if (privacySelectionMissing) return "Please select who can see this post.";
    if (brandDisclosureMissing) {
      return "You need to indicate if your content promotes yourself, a third party, or both.";
    }
    if (!isMetadataValid) return "Complete the TikTok configuration before posting.";
    return null;
  })();
  const isPrimaryActionDisabled = Boolean(primaryActionDisabledReason);
  const primaryActionTooltip = isPrimaryActionDisabled ? primaryActionDisabledReason : null;
  const complianceMessage = useMemo(() => {
    if (!tiktokMetadata || !tiktokMetadata.isCommercialContent) {
      return null;
    }
    const brandOption = tiktokMetadata.brandOption;
    if (brandOption === "BRANDED_CONTENT" || brandOption === "BOTH") {
      return (
        <>
          By posting, you agree to TikTok&apos;s{" "}
          <a
            href={BRANDED_CONTENT_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sky-500 underline"
          >
            Branded Content Policy
          </a>{" "}
          and{" "}
          <a
            href={MUSIC_USAGE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sky-500 underline"
          >
            Music Usage Confirmation
          </a>
          .
        </>
      );
    }
    if (brandOption === "YOUR_BRAND") {
      return (
        <>
          By posting, you agree to TikTok&apos;s{" "}
          <a
            href={MUSIC_USAGE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sky-500 underline"
          >
            Music Usage Confirmation
          </a>
          .
        </>
      );
    }
    return null;
  }, [tiktokMetadata]);

  const handlePrimaryAction = async () => {
    if (scheduleEnabled && !scheduledAt) {
      return;
    }

    // Check if privacy level is selected before posting
    const metadata = typeof window !== 'undefined' ? (window as any).__tiktokMetadata : null;
    if (!metadata || !metadata.privacyLevel) {
      toast.error("Please select who can see this post before posting.");
      return;
    }

    const mode: "post" | "schedule" = scheduleEnabled ? "schedule" : "post";
    setFinalizing(true);
    setFinalizingMode(mode);

    let redirected = false;
    try {
      if (mode === "schedule") {
        setFinalizing(true);
        setFinalizingMode("schedule");
        const result = await scheduleAction.handleSubmit();
        if (result?.scheduled) {
          redirected = true;
          router.push("/dashboard/posts/scheduled");
        }
      } else {
        // Apply metadata from global state before submitting
        if (typeof window !== 'undefined' && (window as any).__tiktokMetadata) {
          const metadata = (window as any).__tiktokMetadata;
          updateDirectPostField("privacyLevel", metadata.privacyLevel);
          updateDirectPostField("disableComment", metadata.disableComment);
          updateDirectPostField("disableDuet", metadata.disableDuet);
          updateDirectPostField("disableStitch", metadata.disableStitch);
          updateDirectPostField("isCommercialContent", metadata.isCommercialContent);
          updateDirectPostField("brandOption", metadata.brandOption);
        }

        const result = await directPostAction.handleSubmit();
        if (result && result.publishId) {
          // Show loading screen for processing immediately
          setPostingData({
            publishId: result.publishId,
            caption: directPostAction.form.caption,
          });
          redirected = true; // Prevent error fallback
        }
      }
    } catch (error) {
      console.error("[CreateSlideshowPostPage] Submission failed", error);

      // Show error as toast
      const errorMessage = error instanceof Error ? error.message : "Failed to post to TikTok";
      toast.error(errorMessage);

      setFinalizing(false);
      setFinalizingMode(null);
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
      toast("Scheduled posts use UTC time.");
    }
  };

  const handleScheduledAtChange = (value: string) => {
    setScheduledAt(value);
    updateScheduleField("publishAt", value);
  };

  const handleSelectAccount = (openId: string) => {
    updateDirectPostField("openId", openId);
    updateScheduleField("openId", openId);
  };

  const handlePostingComplete = (status: string, postId?: string, releaseUrl?: string) => {
    setFinalizing(false);
    setFinalizingMode(null);
    setPostingData(null);

    // Auto-redirect handled by TikTokPostingLoader component
  };

  const handlePostingError = (error: string) => {
    setFinalizing(false);
    setFinalizingMode(null);
    setPostingData(null);
  };

  if (!prepared) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
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
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading accounts" />
                ) : accounts.length === 0 ? (
                  <div className="flex flex-col items-center gap-2">
                    <Button variant="outline" onClick={() => refreshAccounts()}>
                      Refresh accounts
                    </Button>
                    <Button onClick={() => router.push("/dashboard/settings/social")}>
                      Manage TikTok accounts
                    </Button>
                  </div>
                ) : (
                  accounts.map((account) => {
                    const label =
                      account.username ?? account.displayName ?? account.openId;
                    const isSelected =
                      directPostAction.form.openId === account.openId;
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
            action={directPostAction}
            cardTitle="Post configuration"
            submitLabel="Post to TikTok"
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
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Waiting for slides" />
                  <Button onClick={() => router.push("/dashboard/slideshows")}>
                    Back to slideshows
                  </Button>
                </div>
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
                </div>
              )}

              {complianceMessage && (
                <p className="text-xs text-muted-foreground">
                  {complianceMessage}
                </p>
              )}

              {primaryActionTooltip ? (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block w-full">
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={() => void handlePrimaryAction()}
                          disabled={isPrimaryActionDisabled}
                        >
                          {primaryActionLabel}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-center">
                      {primaryActionTooltip}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => void handlePrimaryAction()}
                  disabled={isPrimaryActionDisabled}
                >
                  {primaryActionLabel}
                </Button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* TikTok Posting Loader - Integrated into page */}
      {postingData && (
        <div className="fixed inset-0 top-0 left-0 w-full h-full bg-background/95 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <div className="w-full max-w-2xl">
              <TikTokPostingLoader
                publishId={postingData.publishId}
                openId={directPostAction.form.openId}
                caption={postingData.caption}
                onComplete={handlePostingComplete}
                onError={handlePostingError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
