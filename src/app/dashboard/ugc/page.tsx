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
import type { DemoVideo, GeneratedVideo, ReactionAvatar } from "@/types/ugc";

type SoundItem = {
  key: string;
  name: string;
  size: number;
  ufsUrl?: string;
  url?: string;
  coverUrl?: string | null;
};

import {
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart, 
  Music,
  Plus,
  Trash2,
  VideoOff,
  X,
} from "lucide-react";

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
  
  const [avatarTab, setAvatarTab] = useState("community"); 

  const [demos, setDemos] = useState<DemoVideo[]>([]);
  const [demosLoading, setDemosLoading] = useState(true);
  const [selectedDemoId, setSelectedDemoId] = useState<string>("none");

  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [hook, setHook] = useState("");
  
  const [hookPosition, setHookPosition] = useState<"middle" | "upper">(
    "middle",
  );
  
  const [soundOpen, setSoundOpen] = useState(false);
  const [sounds, setSounds] = useState<SoundItem[]>([]);
  const [soundsLoading, setSoundsLoading] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundItem | null>(null); 
  const [tempSound, setTempSound] = useState<SoundItem | null>(null); 
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
    const candidate = selectedAvatar.videoUrl?.trim();
    if (!candidate || candidate.toLowerCase() === "about:blank") {
      return null;
    }
    return candidate;
  }, [selectedAvatar]);

  
  const previewSources = useMemo(() => {
    const out: string[] = [];
    if (selectedAvatarVideoUrl) out.push(selectedAvatarVideoUrl);
    const demoVideo = selectedDemo?.videoUrl?.trim();
    if (demoVideo) out.push(demoVideo);
    return out;
  }, [selectedAvatarVideoUrl, selectedDemo]);

  const previewFallbackImage = useMemo(() => {
    const thumb = selectedAvatar?.thumbnailUrl?.trim();
    return thumb && thumb.length > 0 ? thumb : null;
  }, [selectedAvatar]);

  const previewVideoKey = `${selectedDemo?.id ?? "none"}:${selectedAvatar?.id ?? "none"}:${selectedAvatarVideoUrl ?? ""}`;

  
  const [activeIdx, setActiveIdx] = useState(0); 
  const [armed, setArmed] = useState(false); 
  const v0Ref = useRef<HTMLVideoElement | null>(null);
  const v1Ref = useRef<HTMLVideoElement | null>(null);
  const transitionLeadMs = 80; 

  const resetSeamlessPreview = () => {
    setActiveIdx(0);
    setArmed(false);
    if (v0Ref.current) {
      v0Ref.current.currentTime = 0;
      
    }
    if (v1Ref.current) {
      v1Ref.current.pause();
      v1Ref.current.currentTime = 0;
    }
  };

  useEffect(() => {
    
    resetSeamlessPreview();
    
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
          overlayText: hook.trim() || undefined, 
          overlayPosition: hookPosition, 
          soundUrl: selectedSound?.ufsUrl || selectedSound?.url, 
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
          {}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
            {}
            <div className="flex flex-col gap-5">
              {}
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

              {}
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

              {}
              <section className="p-0">
                <h2 className="text-base font-semibold">3. Demos</h2>
                <div className="mt-4">
                  {demosLoading ? (
                    <div className="flex h-28 items-center justify-center">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : (
                    <>
                      {}
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
                                {}
                                {demo.thumbnailUrl ? (
                                  
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
                          {}
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

            {}
            <div className="flex flex-col gap-4">
              {}
              <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl bg-black">
                {previewSources.length > 0 || previewFallbackImage ? (
                  <>
                    {previewSources.length > 0 ? (
                      <div className="relative h-full w-full">
                        {}
                        <video
                          key={`${previewVideoKey}:layer0`}
                          ref={v0Ref}
                          src={previewSources[0]}
                          className={`absolute inset-0 h-full w-full object-cover ${activeIdx === 0 ? "opacity-100" : "opacity-0"}`}
                          autoPlay
                          muted
                          playsInline
                          preload="auto"
                          onTimeUpdate={() => {
                            const el = v0Ref.current;
                            
                            if (!el || previewSources.length < 2) return;
                            if (
                              !Number.isFinite(el.duration) ||
                              el.duration === 0
                            )
                              return;
                            const remainingMs =
                              (el.duration - el.currentTime) * 1000;
                            if (remainingMs <= transitionLeadMs && !armed) {
                              
                              if (v1Ref.current) {
                                
                                v1Ref.current.play().catch(() => {});
                                setArmed(true);
                                
                                setActiveIdx(1);
                              }
                            }
                          }}
                          onEnded={() => {
                            
                            if (previewSources.length > 1 && v1Ref.current) {
                              setActiveIdx(1);
                              v1Ref.current.play().catch(() => {});
                            }
                          }}
                        />
                        {}
                        {previewSources[1] ? (
                          <video
                            key={`${previewVideoKey}:layer1`}
                            ref={v1Ref}
                            src={previewSources[1]}
                            className={`absolute inset-0 h-full w-full object-cover ${activeIdx === 1 ? "opacity-100" : "opacity-0"}`}
                            muted
                            playsInline
                            preload="auto"
                            
                            onEnded={() => {
                              
                              resetSeamlessPreview();
                              
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
                        {}
                        <img
                          src={previewFallbackImage}
                          alt={selectedAvatar?.name ?? "Reaction avatar"}
                          className="h-full w-full object-cover"
                        />
                      </>
                    ) : null}
                    {}
                    {hook.trim().length > 0 && (
                      <div
                        className={cn(
                          "pointer-events-none absolute left-1/2 w-[86%] -translate-x-1/2 text-white",
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

              {}
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={hookPosition === "middle" ? "default" : "outline"}
                  onClick={() => setHookPosition("middle")}
                  className="rounded-full px-3"
                  title="Center vertically"
                >
                  {}
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
                  {}
                  <AlignVerticalJustifyStart className="h-4 w-4" />
                </Button>
              </div>

              {}
              <div className="mt-2 w-full flex items-stretch gap-3">
                {}
                <div className="min-w-0 basis-[70%]">
                  <Dialog open={soundOpen} onOpenChange={setSoundOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 w-full rounded-full border overflow-hidden px-0 py-0 items-stretch gap-0"
                      >
                        {}
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
                        {}
                        <div className="flex-1 px-3 flex items-center justify-center">
                          <span className="truncate text-base sm:text-lg font-semibold leading-none text-center">
                            {selectedSound ? selectedSound.name : "No sound"}
                          </span>
                        </div>
                      </Button>
                    </DialogTrigger>
                    {}
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
                            {}
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
                                  {}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {}
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
                {}
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
              {}
            </div>
          </div>
          {}
        </CardContent>
      </Card>

      {}
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
                    {}
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

                    {}
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
