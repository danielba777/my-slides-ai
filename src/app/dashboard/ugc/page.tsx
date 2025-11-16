"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useTikTokAccounts } from "@/hooks/use-tiktok-accounts";
import { cn } from "@/lib/utils";
import { createOptimizedVideoUrl, shouldUseDynamicOptimization } from "@/lib/videoOptimizer";
import type { DemoVideo, GeneratedVideo, ReactionAvatar } from "@/types/ugc";

type SoundItem = {
  key: string;
  name: string;
  size: number;
  ufsUrl?: string;
  url?: string;
  coverUrl?: string | null;
};
// bessere Icons für vertikale Ausrichtung
import {
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart, // top-alignment icon
  Music,
  Plus,
  Trash2,
  VideoOff,
  X,
  Loader2,
} from "lucide-react";
// Sound popover (dialog)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type VideoDialogState = {
  video: GeneratedVideo | null;
};

const createDefaultScheduleAt = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  return now.toISOString().slice(0, 16);
};

export default function UgcDashboardPage() {
  const [avatars, setAvatars] = useState<ReactionAvatar[]>([]);
  const [avatarsLoading, setAvatarsLoading] = useState(true);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  // Community-Tab wird nicht mehr angezeigt
  const [avatarTab, setAvatarTab] = useState("community"); // bleibt intern, UI blendet "Community" aus

  const [demos, setDemos] = useState<DemoVideo[]>([]);
  const [demosLoading, setDemosLoading] = useState(true);
  const [selectedDemoId, setSelectedDemoId] = useState<string>("none");

  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [hook, setHook] = useState("");
  // TikTok-like hook overlay position (preview/UI only)
  const [hookPosition, setHookPosition] = useState<"middle" | "upper">(
    "middle",
  );
  // Sound selection state
  const [soundOpen, setSoundOpen] = useState(false);
  const [sounds, setSounds] = useState<SoundItem[]>([]);
  const [soundsLoading, setSoundsLoading] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundItem | null>(null); // persistierte Auswahl
  const [tempSound, setTempSound] = useState<SoundItem | null>(null); // Auswahl im Dialog
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [dialogState, setDialogState] = useState<VideoDialogState>({
    video: null,
  });
  const [scheduleCaption, setScheduleCaption] = useState("");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [schedulePublishAt, setSchedulePublishAt] = useState(
    createDefaultScheduleAt(),
  );
  const [scheduleAutoMusic, setScheduleAutoMusic] = useState(true);
  const [scheduleIdempotencyKey, setScheduleIdempotencyKey] = useState(
    `ugc_schedule_${Date.now()}`,
  );
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  const {
    accounts,
    loading: accountsLoading,
    refresh: refreshAccounts,
  } = useTikTokAccounts();
  const [scheduleAccountId, setScheduleAccountId] = useState<string>("");

  useEffect(() => {
    void loadAvatars();
    void loadDemos();
    void loadVideos();
    void loadSounds();
  }, []);

  useEffect(() => {
    if (!accountsLoading && accounts.length > 0) {
      setScheduleAccountId((prev) => {
        if (prev) {
          const stillExists = accounts.some(
            (account) => account.openId === prev,
          );
          if (stillExists) {
            return prev;
          }
        }
        return accounts[0]?.openId ?? "";
      });
    }
  }, [accounts, accountsLoading]);

  const loadAvatars = async () => {
    try {
      setAvatarsLoading(true);
      const response = await fetch("/api/ugc/reaction-avatars");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to load reaction avatars");
      }
      const raw: ReactionAvatar[] = Array.isArray(data?.avatars)
        ? data.avatars
        : [];
      // Only show avatars that have a valid hook video
      const avatarsData = raw.filter((a) => {
        const v = (a.videoUrl ?? "").trim().toLowerCase();
        return v && v !== "about:blank";
      });
      setAvatars(avatarsData);
      if (!selectedAvatarId) {
        const firstAvatarId = avatarsData[0]?.id;
        if (firstAvatarId) {
          setSelectedAvatarId(firstAvatarId);
        }
      }
    } catch (error) {
      console.error("[UGC] loadAvatars failed", error);
      toast.error("Unable to load reaction avatars");
    } finally {
      setAvatarsLoading(false);
    }
  };

  const loadDemos = async () => {
    try {
      setDemosLoading(true);
      const response = await fetch("/api/ugc/demos");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to load demo videos");
      }
      const demoData: DemoVideo[] = Array.isArray(data?.demos)
        ? data.demos
        : [];
      setDemos(demoData);
      if (
        demoData.length === 0 ||
        (selectedDemoId !== "none" &&
          !demoData.some((demo) => demo.id === selectedDemoId))
      ) {
        setSelectedDemoId("none");
      }
    } catch (error) {
      console.error("[UGC] loadDemos failed", error);
      toast.error("Unable to load demo videos");
    } finally {
      setDemosLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      setVideosLoading(true);
      const response = await fetch("/api/ugc/videos");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to load generated videos");
      }
      const videoData: GeneratedVideo[] = Array.isArray(data?.videos)
        ? data.videos
        : [];
      setVideos(videoData);
    } catch (error) {
      console.error("[UGC] loadVideos failed", error);
      toast.error("Unable to load generated videos");
    } finally {
      setVideosLoading(false);
    }
  };

  const loadSounds = async () => {
    try {
      setSoundsLoading(true);
      const response = await fetch("/api/ugc/sounds");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to load sounds");
      }
      const soundsData: SoundItem[] = Array.isArray(data?.items)
        ? data.items
        : [];
      setSounds(soundsData);
    } catch (error) {
      console.error("[UGC] loadSounds failed", error);
      toast.error("Unable to load sounds");
    } finally {
      setSoundsLoading(false);
    }
  };

  const selectedAvatar = useMemo(
    () => avatars.find((avatar) => avatar.id === selectedAvatarId) ?? null,
    [avatars, selectedAvatarId],
  );

  const selectedDemo = useMemo(
    () =>
      selectedDemoId === "none"
        ? null
        : (demos.find((demo) => demo.id === selectedDemoId) ?? null),
    [demos, selectedDemoId],
  );

  const selectedAvatarVideoUrl = useMemo(() => {
    if (!selectedAvatar) {
      return null;
    }

    // Get the original video URL
    const originalUrl = selectedAvatar.videoUrl?.trim();
    if (!originalUrl || originalUrl.toLowerCase() === "about:blank") {
      return null;
    }

    // Check if we should use dynamic optimization
    if (shouldUseDynamicOptimization(originalUrl)) {
      const optimizedUrl = createOptimizedVideoUrl(originalUrl, {
        maxWidth: 640,
        maxHeight: 1136,
        quality: 0.6,
        targetBitrate: 500,
        format: 'mp4'
      });
      console.log("[UGC Preview] Using dynamically optimized video:", optimizedUrl);
      return optimizedUrl;
    }

    // Use original URL if no optimization needed
    console.log("[UGC Preview] Using original video:", originalUrl);
    return originalUrl;
  }, [selectedAvatar]);

  /** Preview-Reihenfolge: 1) Avatar-Hook  2) Demo */
  const previewSources = useMemo(() => {
    const out: string[] = [];
    if (selectedAvatarVideoUrl) out.push(selectedAvatarVideoUrl);

    // Also optimize demo videos
    const demoVideo = selectedDemo?.videoUrl?.trim();
    if (demoVideo) {
      if (shouldUseDynamicOptimization(demoVideo)) {
        const optimizedDemoUrl = createOptimizedVideoUrl(demoVideo, {
          maxWidth: 640,
          maxHeight: 1136,
          quality: 0.6,
          targetBitrate: 500,
          format: 'mp4'
        });
        out.push(optimizedDemoUrl);
      } else {
        out.push(demoVideo);
      }
    }
    return out;
  }, [selectedAvatarVideoUrl, selectedDemo]);

  const previewFallbackImage = useMemo(() => {
    const thumb = selectedAvatar?.thumbnailUrl?.trim();
    return thumb && thumb.length > 0 ? thumb : null;
  }, [selectedAvatar]);

  const previewVideoKey = `${selectedDemo?.id ?? "none"}:${selectedAvatar?.id ?? "none"}:${selectedAvatarVideoUrl ?? ""}`;

  /** Nahtloser Preview via Doppel-<video>-Overlay */
  const [activeIdx, setActiveIdx] = useState(0); // welches Video ist sichtbar
  const [armed, setArmed] = useState(false); // ob der Übergang schon vorbereitet ist
  const v0Ref = useRef<HTMLVideoElement | null>(null);
  const v1Ref = useRef<HTMLVideoElement | null>(null);
  const transitionLeadMs = 80; // ~80ms vor Ende starten wir das zweite Video

  // Loading states for videos
  const [videoLoadingStates, setVideoLoadingStates] = useState<{[key: string]: boolean}>({});
  const [videoBufferingStates, setVideoBufferingStates] = useState<{[key: string]: boolean}>({});

  const resetSeamlessPreview = () => {
    setActiveIdx(0);
    setArmed(false);
    if (v0Ref.current) {
      v0Ref.current.currentTime = 0;
      // Autoplay wird weiter unten via autoPlay gesetzt
    }
    if (v1Ref.current) {
      v1Ref.current.pause();
      v1Ref.current.currentTime = 0;
    }
    // Reset loading states when selection changes
    setVideoLoadingStates({});
    setVideoBufferingStates({});
  };

  const updateVideoLoadingState = (videoKey: string, isLoading: boolean) => {
    setVideoLoadingStates(prev => ({ ...prev, [videoKey]: isLoading }));
  };

  const updateVideoBufferingState = (videoKey: string, isBuffering: boolean) => {
    setVideoBufferingStates(prev => ({ ...prev, [videoKey]: isBuffering }));
  };

  // Check if the currently active video is loading or buffering
  const isCurrentlyLoading = useMemo(() => {
    if (previewSources.length === 0) return false;

    const activeVideoKey = activeIdx === 0 ? `${previewVideoKey}:layer0` : `${previewVideoKey}:layer1`;
    const isLoading = videoLoadingStates[activeVideoKey] || false;
    const isBuffering = videoBufferingStates[activeVideoKey] || false;

    return isLoading || isBuffering;
  }, [activeIdx, previewVideoKey, videoLoadingStates, videoBufferingStates, previewSources.length]);

  // Check if we should show loading indicator
  const shouldShowLoadingIndicator = useMemo(() => {
    // Show loading if we have video sources but current video is loading
    if (previewSources.length > 0 && isCurrentlyLoading) return true;

    // Show loading briefly when we first have video sources (initial load)
    const hasVideoSources = previewSources.length > 0;
    const hasLoadingState = Object.keys(videoLoadingStates).length > 0;

    return hasVideoSources && !hasLoadingState;
  }, [previewSources.length, isCurrentlyLoading, videoLoadingStates]);

  useEffect(() => {
    // Bei neuer Auswahl komplett zurücksetzen
    resetSeamlessPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewVideoKey]);

  const handleGenerate = async () => {
    if (!selectedAvatar) {
      toast.error("Select a reaction avatar first");
      return;
    }
    try {
      setIsGenerating(true);
      const response = await fetch("/api/ugc/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reactionAvatarId: selectedAvatar.id,
          demoVideoId: selectedDemo?.id ?? undefined,
          title: hook.trim() || undefined,
          overlayText: hook.trim() || undefined, // Hook-Text ins Video brennen
          overlayPosition: hookPosition, // "upper" | "middle"
          soundUrl: selectedSound?.ufsUrl || selectedSound?.url, // Sound-URL
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Video generation failed");
      }
      toast.success("Video created");
      setVideos((prev) => [data.video as GeneratedVideo, ...prev]);
    } catch (error) {
      console.error("[UGC] handleGenerate failed", error);
      toast.error(
        error instanceof Error ? error.message : "Video generation failed",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (video: GeneratedVideo) => {
    const anchor = document.createElement("a");
    anchor.href = video.compositeVideoUrl;
    anchor.download = `${video.title ?? "ugc-video"}.mp4`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleOpenVideo = (video: GeneratedVideo) => {
    setDialogState({ video });
    setScheduleCaption(video.title ?? "");
    setScheduleTitle(video.title ?? "");
    setSchedulePublishAt(createDefaultScheduleAt());
    setScheduleAutoMusic(true);
    setScheduleIdempotencyKey(`ugc_schedule_${Date.now()}`);
  };

  const handleSchedule = async () => {
    const currentVideo = dialogState.video;
    if (!currentVideo) return;
    if (!scheduleAccountId) {
      toast.error("Connect a TikTok account first");
      return;
    }
    try {
      setScheduleSubmitting(true);
      const response = await fetch(
        `/api/ugc/videos/${currentVideo.id}/schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            openId: scheduleAccountId,
            publishAt: schedulePublishAt,
            idempotencyKey:
              scheduleIdempotencyKey.trim() || `ugc_${Date.now()}`,
            caption: scheduleCaption,
            title: scheduleTitle,
            autoAddMusic: scheduleAutoMusic,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Scheduling failed");
      }
      toast.success("Video scheduled");
      setVideos((prev) =>
        prev.map((item) =>
          item.id === currentVideo.id
            ? {
                ...item,
                scheduleJobId:
                  (data &&
                  typeof data === "object" &&
                  data !== null &&
                  "jobKey" in data
                    ? (data as { jobKey?: string }).jobKey
                    : item.scheduleJobId) ?? item.scheduleJobId,
                scheduleRunAt:
                  (data &&
                  typeof data === "object" &&
                  data !== null &&
                  "runAt" in data
                    ? (data as { runAt?: string }).runAt
                    : item.scheduleRunAt) ?? item.scheduleRunAt,
              }
            : item,
        ),
      );
      setDialogState({ video: null });
    } catch (error) {
      console.error("[UGC] handleSchedule failed", error);
      toast.error(error instanceof Error ? error.message : "Scheduling failed");
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const activeVideo = dialogState.video;

  const statusStyleMap: Record<GeneratedVideo["status"], string> = {
    READY: "bg-emerald-100 text-emerald-700",
    PROCESSING: "bg-amber-100 text-amber-700",
    DRAFT: "bg-muted text-muted-foreground",
    FAILED: "bg-red-100 text-red-700",
  };

  const statusLabelMap: Record<GeneratedVideo["status"], string> = {
    READY: "Ready",
    PROCESSING: "Processing",
    DRAFT: "Draft",
    FAILED: "Failed",
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString();
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6 md:p-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Create UGC ads
        </h1>
      </header>

      <Card className="rounded-3xl border border-border/60 bg-card/95 shadow-xl">
        <CardContent className="p-5 sm:p-7 lg:p-9">
          {/* 60% / 40% Layout */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
            {/* LEFT: Hook + Avatars + Demos */}
            <div className="flex flex-col gap-5">
              {/* Hook (ohne innere Box) */}
              <section className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">1. Hook</h2>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                  <Input
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    placeholder="Write your hook"
                    className="h-12 flex-1 rounded-full border border-border/40 bg-muted px-5 text-base shadow-inner focus-visible:ring-2 focus-visible:ring-foreground/20"
                  />
                </div>
              </section>

              {/* Avatars (ohne Tabs) */}
              <section className="p-0">
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">2. AI Avatar</h2>
                  </div>
                </div>
                <div className="mt-4">
                  {avatarsLoading ? (
                    <div className="flex h-64 items-center justify-center">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : avatars.length === 0 ? (
                    <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/40 text-center text-sm text-muted-foreground">
                      Keine passenden Avatare mit Video vorhanden.
                    </div>
                  ) : (
                    <ScrollArea className="h-64 sm:h-72 lg:h-80 rounded-2xl border border-border/50 bg-muted/40">
                      <div className="grid grid-cols-4 gap-2 p-2 sm:grid-cols-6 md:grid-cols-8">
                        {avatars.slice(0, 48).map((avatar) => (
                          <button
                            key={avatar.id}
                            className={cn(
                              "relative aspect-square overflow-hidden rounded-lg border border-transparent transition-all duration-150 hover:ring-2 hover:ring-foreground/40",
                              selectedAvatarId === avatar.id
                                ? "ring-2 ring-foreground"
                                : "",
                            )}
                            onClick={() => setSelectedAvatarId(avatar.id)}
                          >
                            <img
                              src={avatar.thumbnailUrl}
                              className="h-full w-full object-cover"
                              alt={avatar.name}
                            />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </section>

              {/* Demos (ohne Box, als 9:16 Cards + Platzhalter rechts) */}
              <section className="p-0">
                <h2 className="text-base font-semibold">3. Demos</h2>
                <div className="mt-4">
                  {demosLoading ? (
                    <div className="flex h-28 items-center justify-center">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : (
                    <>
                      {/* exakt 1 Zeile sichtbar – horizontal scrollen bei Overflow */}
                      <div className="rounded-2xl border border-border/50 bg-muted/40 overflow-x-auto">
                        <div className="flex flex-nowrap items-center gap-3 p-3">
                          {demos.map((demo) => {
                            const isActive = selectedDemoId === demo.id;
                            return (
                              <button
                                key={demo.id}
                                type="button"
                                onClick={() => setSelectedDemoId(demo.id)}
                                className={cn(
                                  "relative aspect-[9/16] h-[120px] overflow-hidden rounded-xl border bg-black text-white transition",
                                  isActive
                                    ? "ring-2 ring-foreground"
                                    : "hover:ring-2 hover:ring-foreground/40",
                                )}
                                title={demo.name || "Demo"}
                              >
                                {/* Thumbnail falls vorhanden, sonst dunkle Fläche */}
                                {demo.thumbnailUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={demo.thumbnailUrl}
                                    alt={demo.name || "Demo"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-white/70">
                                    Demo
                                  </div>
                                )}
                              </button>
                            );
                          })}
                          {/* Platzhalter-Kärtchen mit + ganz rechts */}
                          <Link
                            href="/dashboard/account/settings#demos"
                            className="relative aspect-[9/16] h-[120px] rounded-xl border border-dashed border-border/70 bg-background/60 hover:border-foreground/50 hover:bg-background/80 flex items-center justify-center"
                            title="Upload demo"
                          >
                            <Plus className="h-6 w-6" />
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>

            {/* RIGHT: Video Preview + Controls (ohne zusätzliche Box) */}
            <div className="flex flex-col gap-4">
              {/* etwas kompakter (ca. -20%) */}
              <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl bg-black">
                {previewSources.length > 0 || previewFallbackImage ? (
                  <>
                    {previewSources.length > 0 ? (
                      <div className="relative h-full w-full">
                        {/* Layer 0 (Hook) */}
                        <video
                          key={`${previewVideoKey}:layer0`}
                          ref={v0Ref}
                          src={previewSources[0]}
                          className={`absolute inset-0 h-full w-full object-cover ${activeIdx === 0 ? "opacity-100" : "opacity-0"}`}
                          autoPlay
                          muted
                          playsInline
                          preload="metadata"
                          style={{
                            objectFit: "cover",
                            WebkitOptimizedInlineVideo: true, // Safari optimization
                            willChange: "auto", // Performance hint
                          }}
                          onLoadStart={() => {
                            console.log("[Video] Layer 0 loading:", previewSources[0]);
                            const videoKey = `${previewVideoKey}:layer0`;
                            updateVideoLoadingState(videoKey, true);
                            updateVideoBufferingState(videoKey, false);
                          }}
                          onLoadedData={() => {
                            console.log("[Video] Layer 0 loaded data");
                            const videoKey = `${previewVideoKey}:layer0`;
                            updateVideoLoadingState(videoKey, false);
                          }}
                          onCanPlay={() => {
                            console.log("[Video] Layer 0 can play");
                            const videoKey = `${previewVideoKey}:layer0`;
                            updateVideoLoadingState(videoKey, false);
                            updateVideoBufferingState(videoKey, false);
                          }}
                          onWaiting={() => {
                            console.log("[Video] Layer 0 buffering...");
                            const videoKey = `${previewVideoKey}:layer0`;
                            updateVideoBufferingState(videoKey, true);
                          }}
                          onPlaying={() => {
                            console.log("[Video] Layer 0 playing");
                            const videoKey = `${previewVideoKey}:layer0`;
                            updateVideoLoadingState(videoKey, false);
                            updateVideoBufferingState(videoKey, false);
                          }}
                          onError={(e) => {
                            console.error("[Video] Layer 0 error:", e, previewSources[0]);
                            const videoKey = `${previewVideoKey}:layer0`;
                            updateVideoLoadingState(videoKey, false);
                            updateVideoBufferingState(videoKey, false);
                          }}
                          onTimeUpdate={() => {
                            const el = v0Ref.current;
                            // Wenn nur ein Source vorhanden, kein Seamless nötig
                            if (!el || previewSources.length < 2) return;
                            if (
                              !Number.isFinite(el.duration) ||
                              el.duration === 0
                            )
                              return;
                            const remainingMs =
                              (el.duration - el.currentTime) * 1000;
                            if (remainingMs <= transitionLeadMs && !armed) {
                              // Zweites Video vorbereiten & starten
                              if (v1Ref.current) {
                                // iOS braucht einen Play-Aufruf, wenn muted + playsInline gesetzt sind
                                v1Ref.current.play().catch(() => {});
                                setArmed(true);
                                // Sofort sichtbar schalten, um den schwarzen Frame zu vermeiden
                                setActiveIdx(1);
                              }
                            }
                          }}
                          onEnded={() => {
                            // Fallback falls timeupdate knapp verpasst wurde
                            if (previewSources.length > 1 && v1Ref.current) {
                              setActiveIdx(1);
                              v1Ref.current.play().catch(() => {});
                            }
                          }}
                        />
                        {/* Layer 1 (Demo) */}
                        {previewSources[1] ? (
                          <video
                            key={`${previewVideoKey}:layer1`}
                            ref={v1Ref}
                            src={previewSources[1]}
                            className={`absolute inset-0 h-full w-full object-cover ${activeIdx === 1 ? "opacity-100" : "opacity-0"}`}
                            muted
                            playsInline
                            preload="none"
                            style={{
                              objectFit: "cover",
                              WebkitOptimizedInlineVideo: true, // Safari optimization
                              willChange: "auto", // Performance hint
                            }}
                            onLoadStart={() => {
                              console.log("[Video] Layer 1 loading:", previewSources[1]);
                              const videoKey = `${previewVideoKey}:layer1`;
                              updateVideoLoadingState(videoKey, true);
                              updateVideoBufferingState(videoKey, false);
                            }}
                            onLoadedData={() => {
                              console.log("[Video] Layer 1 loaded data");
                              const videoKey = `${previewVideoKey}:layer1`;
                              updateVideoLoadingState(videoKey, false);
                            }}
                            onCanPlay={() => {
                              console.log("[Video] Layer 1 can play");
                              const videoKey = `${previewVideoKey}:layer1`;
                              updateVideoLoadingState(videoKey, false);
                              updateVideoBufferingState(videoKey, false);
                            }}
                            onWaiting={() => {
                              console.log("[Video] Layer 1 buffering...");
                              const videoKey = `${previewVideoKey}:layer1`;
                              updateVideoBufferingState(videoKey, true);
                            }}
                            onPlaying={() => {
                              console.log("[Video] Layer 1 playing");
                              const videoKey = `${previewVideoKey}:layer1`;
                              updateVideoLoadingState(videoKey, false);
                              updateVideoBufferingState(videoKey, false);
                            }}
                            onError={(e) => {
                              console.error("[Video] Layer 1 error:", e, previewSources[1]);
                              const videoKey = `${previewVideoKey}:layer1`;
                              updateVideoLoadingState(videoKey, false);
                              updateVideoBufferingState(videoKey, false);
                            }}
                            // nicht autoPlay: wir starten gezielt kurz vor Ende von Layer 0
                            onEnded={() => {
                              // Für Preview zur Schleife zurück an den Start
                              resetSeamlessPreview();
                              // Autoplay neu starten
                              requestAnimationFrame(() => {
                                if (v0Ref.current) {
                                  v0Ref.current.play().catch(() => {});
                                }
                              });
                            }}
                          />
                        ) : null}
                      </div>
                    ) : previewFallbackImage ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewFallbackImage}
                          alt={selectedAvatar?.name ?? "Reaction avatar"}
                          className="h-full w-full object-cover"
                        />
                      </>
                    ) : null}
                    {/* Hook Overlay (ohne IIFE im style → Parser-sicher) */}
                    {hook.trim().length > 0 && (
                      <div
                        className={cn(
                          "pointer-events-none absolute left-1/2 w-[86%] -translate-x-1/2 text-white z-10",
                          hookPosition === "middle"
                            ? "top-1/2 -translate-y-1/2"
                            : "top-[18%]",
                        )}
                      >
                        <span
                          className="block text-center"
                          style={{
                            fontFamily: "var(--font-sans), sans-serif",
                            fontWeight: 800,
                            fontSize: "54px",
                            lineHeight: 1.1,
                            WebkitTextStroke: "3px black",
                            textShadow:
                              "2px 2px 4px rgba(0,0,0,0.65), 0 0 3px rgba(0,0,0,0.55)",
                            letterSpacing: "0.2px",
                          }}
                        >
                          {hook}
                        </span>
                      </div>
                    )}

                    {/* Loading Overlay */}
                    {shouldShowLoadingIndicator && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3 text-white">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="text-sm font-medium">
                            {isCurrentlyLoading ? "Buffering..." : "Loading video..."}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <VideoOff className="h-4 w-4" />
                      Choose a avatar or demo to preview
                    </div>
                  </div>
                )}
              </div>

              {/* Hook-Position als Icons (unter dem Video) */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={hookPosition === "middle" ? "default" : "outline"}
                  onClick={() => setHookPosition("middle")}
                  className="rounded-full px-3"
                  title="Center vertically"
                >
                  {/* Linkes Icon: vertikal zentriert */}
                  <AlignVerticalJustifyCenter className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={hookPosition === "upper" ? "default" : "outline"}
                  onClick={() => setHookPosition("upper")}
                  className="rounded-full px-3"
                  title="Top vertically"
                >
                  {/* Rechtes Icon: Top Alignment */}
                  <AlignVerticalJustifyStart className="h-4 w-4" />
                </Button>
              </div>

              {/* Sound (70%) links, Generate (30%) rechts – gemeinsames Flex-Layout */}
              <div className="mt-2 w-full flex items-stretch gap-3">
                {/* LINKS: Sound – 70% Breite */}
                <div className="min-w-0 basis-[70%]">
                  <Dialog open={soundOpen} onOpenChange={setSoundOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 w-full rounded-full border overflow-hidden px-0 py-0 items-stretch gap-0"
                      >
                        {/* Bild links, abgerundet; rechte Abschlusslinie */}
                        <div className="relative h-full w-12 self-stretch shrink-0 overflow-hidden rounded-l-full border-r">
                          {selectedSound?.coverUrl ? (
                            <img
                              src={selectedSound.coverUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted" />
                          )}
                        </div>
                        {/* Text rechts: zentriert & nur Name */}
                        <div className="flex-1 px-3 flex items-center justify-center">
                          <span className="truncate text-base sm:text-lg font-semibold leading-none text-center">
                            {selectedSound ? selectedSound.name : "No sound"}
                          </span>
                        </div>
                      </Button>
                    </DialogTrigger>
                    {/* Sound Dialog */}
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Choose sound</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {soundsLoading ? (
                          <div className="flex h-32 items-center justify-center">
                            <Spinner className="h-6 w-6" />
                          </div>
                        ) : sounds.length === 0 ? (
                          <div className="text-center text-sm text-muted-foreground">
                            No sounds available.
                          </div>
                        ) : (
                          <div className="grid gap-2 max-h-64 overflow-y-auto">
                            {/* Special 'No sound' option */}
                            <button
                              onClick={() => {
                                setTempSound(null);
                                if (audioRef.current) {
                                  audioRef.current.pause();
                                  audioRef.current.currentTime = 0;
                                }
                              }}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border text-left transition-colors hover:bg-muted/50",
                                tempSound === null ||
                                  (tempSound === undefined &&
                                    selectedSound === null)
                                  ? "border-primary bg-primary/5"
                                  : "border-border",
                              )}
                            >
                              <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                                <div className="h-full w-full bg-muted/70 flex items-center justify-center">
                                  <X className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div
                                  className={cn(
                                    "truncate",
                                    tempSound === null ||
                                      (tempSound === undefined &&
                                        selectedSound === null)
                                      ? "font-semibold text-foreground"
                                      : "font-medium",
                                  )}
                                >
                                  No sound
                                </div>
                              </div>
                            </button>
                            {sounds.map((sound) => (
                              <button
                                key={sound.key}
                                onClick={() => {
                                  setTempSound(sound);
                                  // Preview direkt loopen
                                  setTimeout(() => {
                                    if (audioRef.current) {
                                      audioRef.current.currentTime = 0;
                                      audioRef.current.play().catch(() => {});
                                    }
                                  }, 0);
                                }}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-xl border text-left transition-colors hover:bg-muted/50",
                                  (tempSound?.key ?? selectedSound?.key) ===
                                    sound.key
                                    ? "border-primary bg-primary/5"
                                    : "border-border",
                                )}
                              >
                                <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                                  {sound.coverUrl ? (
                                    <img
                                      src={sound.coverUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full bg-muted flex items-center justify-center">
                                      <Music className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div
                                    className={cn(
                                      "truncate",
                                      (tempSound?.key ?? selectedSound?.key) ===
                                        sound.key
                                        ? "font-semibold text-foreground"
                                        : "font-medium",
                                    )}
                                  >
                                    {sound.name}
                                  </div>
                                  {/* KB-Anzeige entfernt */}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* versteckter Audio-Player für Loop-Preview */}
                      <DialogFooter className="flex items-center justify-between gap-3">
                        <audio
                          ref={audioRef}
                          src={
                            (tempSound ?? selectedSound)?.ufsUrl ??
                            (tempSound ?? selectedSound)?.url ??
                            undefined
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setTempSound(null);
                              setSoundOpen(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              // Exklusives Verhalten für "No sound":
                              // - Wenn tempSound === null → immer stumm schalten.
                              // - Wenn tempSound ein Sound-Objekt ist → diesen übernehmen.
                              // - Wenn tempSound === undefined → Auswahl unverändert lassen.
                              if (tempSound === null) {
                                setSelectedSound(null);
                              } else if (typeof tempSound !== "undefined") {
                                setSelectedSound(tempSound);
                              }
                              setSoundOpen(false);
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {/* RECHTS: Generate – 30% Breite */}
                <div className="basis-[30%]">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !selectedAvatarId}
                    className="h-12 w-full rounded-full px-6 text-base"
                  >
                    {isGenerating ? "Generating…" : "Generate"}
                  </Button>
                </div>
              </div>
              {/* schließt RIGHT column */}
            </div>
          </div>
          {/* schließt den grid-Container (lg:grid-cols-[...]) */}
        </CardContent>
      </Card>

      {/* MY VIDEOS – wie AI Avatars (Kacheln + Aktionen) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              My Videos ({videos.length})
            </h2>
          </div>
        </div>

        {videosLoading ? (
          <div className="flex h-28 items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : videos.length === 0 ? (
          // Platzhalter-Kacheln wie bei Avataren/Templates
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[9/16] w-full rounded-xl border border-dashed border-border/60 bg-background/50"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {videos.map((video) => (
              <Card
                key={video.id}
                className="group overflow-hidden rounded-2xl"
              >
                <CardContent className="p-0">
                  <div className="relative">
                    {video.compositeThumbnailUrl ? (
                      <img
                        src={video.compositeThumbnailUrl}
                        alt={video.title ?? "UGC Video"}
                        className="aspect-[9/16] w-full object-cover"
                      />
                    ) : (
                      <video
                        src={video.compositeVideoUrl}
                        muted
                        className="aspect-[9/16] w-full bg-black object-cover"
                      />
                    )}
                    {/* Hover-Delete oben rechts */}
                    <button
                      title="Delete"
                      onClick={async () => {
                        try {
                          setDeletingId(video.id);
                          const res = await fetch(
                            `/api/ugc/videos/${video.id}`,
                            { method: "DELETE" },
                          );
                          if (!res.ok) throw new Error("Delete failed");
                          setVideos((prev) =>
                            prev.filter((v) => v.id !== video.id),
                          );
                          toast.success("Video deleted");
                        } catch (e) {
                          toast.error("Delete failed");
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* Overlay-Buttons im Bild – wie Recently Created */}
                    <div className="absolute inset-x-2 bottom-2 flex flex-col gap-2">
                      <Link
                        href={video.compositeVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex"
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full rounded-full"
                        >
                          Open in new tab
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="w-full rounded-full"
                        onClick={() => handleOpenVideo(video)}
                      >
                        Post on TikTok
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(activeVideo)}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState({ video: null });
          }
        }}
      >
        <DialogContent className="max-w-4xl space-y-6">
          {activeVideo ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-border/60 bg-black">
                  <video
                    key={activeVideo.id}
                    src={activeVideo.compositeVideoUrl}
                    controls
                    playsInline
                    className="aspect-[9/16] w-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-full px-4"
                  onClick={() => handleDownload(activeVideo)}
                >
                  Download
                </Button>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <DialogTitle>{activeVideo.title || "UGC Video"}</DialogTitle>
                  <DialogDescription>
                    Plane den Upload oder lade das Video direkt herunter.
                  </DialogDescription>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-title">Titel</Label>
                    <Input
                      id="schedule-title"
                      value={scheduleTitle}
                      onChange={(event) => setScheduleTitle(event.target.value)}
                      placeholder="Titel für TikTok"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-caption">Caption</Label>
                    <Input
                      id="schedule-caption"
                      value={scheduleCaption}
                      onChange={(event) =>
                        setScheduleCaption(event.target.value)
                      }
                      placeholder="Beschriftung"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-date">Publish at</Label>
                    <Input
                      id="schedule-date"
                      type="datetime-local"
                      value={schedulePublishAt}
                      onChange={(event) =>
                        setSchedulePublishAt(event.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>TikTok Account</Label>
                    {accounts.length > 0 ? (
                      <Select
                        value={scheduleAccountId}
                        onValueChange={setScheduleAccountId}
                      >
                        <SelectTrigger className="rounded-full px-4">
                          <SelectValue placeholder="Account wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem
                              key={account.openId}
                              value={account.openId}
                            >
                              @
                              {account.username ||
                                account.displayName ||
                                account.openId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border/50 bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                        Verbinde zuerst einen TikTok Account im Account-Bereich.
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <div>
                      <span className="text-sm font-medium">Auto Music</span>
                      <p className="text-xs text-muted-foreground">
                        Lass TikTok automatisch Musik ergänzen.
                      </p>
                    </div>
                    <Switch
                      checked={scheduleAutoMusic}
                      onCheckedChange={setScheduleAutoMusic}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-idempotency">
                      Idempotency Key
                    </Label>
                    <Input
                      id="schedule-idempotency"
                      value={scheduleIdempotencyKey}
                      onChange={(event) =>
                        setScheduleIdempotencyKey(event.target.value)
                      }
                    />
                  </div>
                </div>
                {activeVideo.status !== "READY" ? (
                  <div className="rounded-lg bg-amber-100/70 px-3 py-2 text-xs text-amber-800">
                    Dieses Video wird noch verarbeitet. Scheduling wird
                    verfügbar, sobald der Status auf Ready wechselt.
                  </div>
                ) : null}
                <DialogFooter className="gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full px-4"
                    onClick={() => setDialogState({ video: null })}
                  >
                    Schließen
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSchedule}
                    disabled={
                      scheduleSubmitting ||
                      !scheduleAccountId ||
                      accounts.length === 0 ||
                      !activeVideo ||
                      activeVideo.status !== "READY"
                    }
                    className="rounded-full px-6"
                  >
                    {scheduleSubmitting ? "Scheduling..." : "Planen"}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
