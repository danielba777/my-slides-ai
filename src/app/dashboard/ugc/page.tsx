"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTikTokAccounts } from "@/hooks/use-tiktok-accounts";
import { cn } from "@/lib/utils";
import type { DemoVideo, GeneratedVideo, ReactionAvatar } from "@/types/ugc";
import { RefreshCw, Settings, VideoOff } from "lucide-react";
// Sound-Popover (Dialog)
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
  const [avatarTab, setAvatarTab] = useState("default");

  const [demos, setDemos] = useState<DemoVideo[]>([]);
  const [demosLoading, setDemosLoading] = useState(true);
  const [selectedDemoId, setSelectedDemoId] = useState<string>("none");

  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);

  const [hook, setHook] = useState("");
  // TikTok-like Hook Overlay Position (nur Preview/UI)
  const [hookPosition, setHookPosition] = useState<"middle" | "upper">(
    "middle",
  );
  // Sound-Dialog (UI-only). Später ans Render-POST anbindbar.
  const [soundOpen, setSoundOpen] = useState(false);
  const [soundSource, setSoundSource] = useState<"community" | "my">(
    "community",
  );
  const [soundUrl, setSoundUrl] = useState<string>("");
  // ausgewählter Sound (nur UI-Label)
  const [soundLabel, setSoundLabel] = useState<string>("Sound");
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
      const avatarsData: ReactionAvatar[] = Array.isArray(data?.avatars)
        ? data.avatars
        : [];
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

  const previewVideoSrc = useMemo(() => {
    const demoVideo = selectedDemo?.videoUrl?.trim();
    if (demoVideo) {
      return demoVideo;
    }
    if (selectedAvatarVideoUrl) {
      return selectedAvatarVideoUrl;
    }
    return null;
  }, [selectedAvatarVideoUrl, selectedDemo]);

  const previewFallbackImage = useMemo(() => {
    const thumb = selectedAvatar?.thumbnailUrl?.trim();
    return thumb && thumb.length > 0 ? thumb : null;
  }, [selectedAvatar]);

  const previewVideoKey = `${selectedDemo?.id ?? "none"}:${selectedAvatar?.id ?? "none"}:${selectedAvatarVideoUrl ?? ""}`;

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
        <p className="text-sm text-muted-foreground">
          Stelle Hook, Avatar und Demo kompakt zusammen und prüfe rechts sofort
          die Vorschau.
        </p>
      </header>

      <Card className="rounded-3xl border border-border/60 bg-card/95 shadow-xl">
        <CardContent className="p-5 sm:p-7 lg:p-9">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,360px)] lg:items-start">
            {/* LEFT: Hook + Avatars + Demos */}
            <div className="flex flex-col gap-5">
              {/* Hook */}
              <section className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">1. Hook</h2>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                  <Input
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    placeholder="Schreibe deinen Hook"
                    className="h-12 flex-1 rounded-full border-0 bg-muted px-5 text-base shadow-inner focus-visible:ring-2 focus-visible:ring-foreground/20"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        hookPosition === "middle" ? "default" : "outline"
                      }
                      onClick={() => setHookPosition("middle")}
                      className="rounded-full px-4"
                      title="Vertikal zentrieren"
                    >
                      Mid
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={hookPosition === "upper" ? "default" : "outline"}
                      onClick={() => setHookPosition("upper")}
                      className="rounded-full px-4"
                      title="Weiter oben positionieren"
                    >
                      Up
                    </Button>
                  </div>
                </div>
              </section>

              {/* Avatars */}
              <section className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">2. AI Avatar</h2>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full px-3"
                    onClick={() => {
                      void loadAvatars();
                    }}
                    disabled={avatarsLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Aktualisieren
                  </Button>
                </div>

                <Tabs
                  value={avatarTab}
                  onValueChange={setAvatarTab}
                  className="mt-4"
                >
                  <TabsList className="grid h-10 w-full grid-cols-3 rounded-full bg-muted p-1">
                    <TabsTrigger
                      value="default"
                      className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Default
                    </TabsTrigger>
                    <TabsTrigger
                      value="ugc"
                      className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      My UGC
                    </TabsTrigger>
                    <TabsTrigger
                      value="uploads"
                      className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Uploads
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="default" className="mt-4">
                    {avatarsLoading ? (
                      <div className="flex h-48 items-center justify-center">
                        <Spinner className="h-6 w-6" />
                      </div>
                    ) : avatars.length === 0 ? (
                      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/40 text-center text-sm text-muted-foreground">
                        No reaction avatars yet. Add them via the admin panel.
                      </div>
                    ) : (
                      <ScrollArea className="h-52 rounded-2xl border border-border/50 bg-muted/40">
                        <div className="grid grid-cols-3 gap-3 p-3 sm:grid-cols-4 md:grid-cols-5">
                          {avatars.slice(0, 30).map((avatar) => (
                            <button
                              key={avatar.id}
                              className={cn(
                                "group relative aspect-square overflow-hidden rounded-xl border border-transparent transition-all duration-150 hover:border-foreground/60",
                                selectedAvatarId === avatar.id
                                  ? "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                                  : "",
                              )}
                              onClick={() => setSelectedAvatarId(avatar.id)}
                              title={avatar.name}
                            >
                              <img
                                src={avatar.thumbnailUrl}
                                className="h-full w-full object-cover"
                                alt={avatar.name}
                              />
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-left text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                                {avatar.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>

                  <TabsContent value="ugc" className="mt-4">
                    <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/30 text-sm text-muted-foreground">
                      Verbinde deine persönlichen Avatare – Upload bald
                      verfügbar.
                    </div>
                  </TabsContent>

                  <TabsContent value="uploads" className="mt-4">
                    <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/30 text-sm text-muted-foreground">
                      Lade eigene Clips hoch, um sie als Avatar zu nutzen.
                      Coming soon.
                    </div>
                  </TabsContent>
                </Tabs>
              </section>

              {/* Demos */}
              <section className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">3. Demos</h2>
                  </div>
                  <Link href="/admin/ugc/reaction-avatars">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full px-3"
                    >
                      <span className="text-base font-semibold">+</span>
                    </Button>
                  </Link>
                </div>
                <div className="mt-4">
                  {demosLoading ? (
                    <div className="flex h-28 items-center justify-center">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : (
                    <ScrollArea className="h-28 rounded-2xl border border-border/50 bg-muted/40">
                      <div className="flex flex-wrap gap-2 p-3">
                        <button
                          type="button"
                          onClick={() => setSelectedDemoId("none")}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-sm transition",
                            selectedDemoId === "none"
                              ? "bg-foreground text-background shadow-sm"
                              : "bg-background/80 text-foreground hover:bg-background",
                          )}
                        >
                          None
                        </button>
                        {demos.map((demo) => (
                          <button
                            type="button"
                            key={demo.id}
                            onClick={() => setSelectedDemoId(demo.id)}
                            className={cn(
                              "rounded-full px-3 py-1.5 text-sm transition",
                              selectedDemoId === demo.id
                                ? "bg-foreground text-background shadow-sm"
                                : "bg-background/80 text-foreground hover:bg-background",
                            )}
                          >
                            {demo.name || "Demo"}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </section>
            </div>

            {/* RIGHT: Preview + Bottom row (Sound + Generate) */}
            <div className="flex flex-col gap-5">
              <section className="rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <div className="relative mx-auto aspect-[9/16] w-full max-w-[340px] overflow-hidden rounded-2xl bg-black">
                  {previewVideoSrc || previewFallbackImage ? (
                    <>
                      {previewVideoSrc ? (
                        <video
                          key={previewVideoKey}
                          src={previewVideoSrc}
                          className="h-full w-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
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
                      {/* Hook Overlay */}
                      {hook.trim().length > 0 && (
                        <div
                          className={cn(
                            "pointer-events-none absolute left-1/2 w-[86%] -translate-x-1/2 text-center text-white",
                            hookPosition === "middle"
                              ? "top-1/2 -translate-y-1/2"
                              : "top-[18%]",
                          )}
                          style={{
                            WebkitTextStroke: "2px rgba(0,0,0,0.85)",
                            textShadow:
                              "0 2px 6px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.5)",
                          }}
                        >
                          <span className="text-2xl font-semibold leading-snug md:text-3xl">
                            {hook}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <VideoOff className="h-4 w-4" />
                        Wähle einen Avatar und optional eine Demo.
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Bottom row: Sound (Dialog) + Generate */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Dialog open={soundOpen} onOpenChange={setSoundOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex min-w-[160px] items-center justify-between gap-2 rounded-full px-4"
                    >
                      <span className="truncate">{soundLabel}</span>
                      <span className="text-xs text-muted-foreground">
                        ändern
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Sound auswählen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={
                            soundSource === "community" ? "default" : "outline"
                          }
                          onClick={() => setSoundSource("community")}
                          className="rounded-full px-4"
                        >
                          Community
                        </Button>
                        <Button
                          type="button"
                          variant={soundSource === "my" ? "default" : "outline"}
                          onClick={() => setSoundSource("my")}
                          className="rounded-full px-4"
                        >
                          My Uploads
                        </Button>
                      </div>
                      {soundSource === "my" ? (
                        <div className="space-y-2">
                          <Input
                            value={soundUrl}
                            onChange={(e) => setSoundUrl(e.target.value)}
                            placeholder="Eigene Sound-URL (UI-only)"
                          />
                          <div className="flex justify-end">
                            <Button
                              onClick={() => {
                                setSoundLabel(soundUrl ? "My upload" : "Sound");
                                setSoundOpen(false);
                              }}
                              disabled={!soundUrl}
                            >
                              Übernehmen
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            "Trending 01",
                            "Trending 02",
                            "Trending 03",
                            "Trending 04",
                          ].map((label) => (
                            <button
                              key={label}
                              onClick={() => {
                                setSoundLabel(label);
                                setSoundOpen(false);
                              }}
                              className="rounded-md border p-3 text-left text-sm hover:bg-muted"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedAvatarId}
                  className="h-12 rounded-full px-8 text-base"
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              My Videos ({videos.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Alle generierten Videos auf einen Blick – öffne sie für Preview,
              Download oder Scheduling.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-full px-4"
              onClick={() => {
                void loadVideos();
              }}
              disabled={videosLoading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-full px-4"
              onClick={() => {
                void refreshAccounts();
              }}
              disabled={accountsLoading}
            >
              <Settings className="h-4 w-4" />
              Accounts
            </Button>
          </div>
        </div>

        {videosLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-[9/16] w-full rounded-2xl border border-dashed border-border/60 bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-10 text-center text-sm text-muted-foreground">
            Noch keine Videos. Generiere deinen ersten Clip oben.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => {
              const statusStyle =
                statusStyleMap[video.status] ??
                "bg-muted text-muted-foreground";
              const statusLabel = statusLabelMap[video.status] ?? video.status;
              const scheduled = formatDateTime(video.scheduleRunAt);
              const created = formatDateTime(video.createdAt);
              return (
                <Card
                  key={video.id}
                  className="flex h-full flex-col gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm"
                >
                  <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
                    {video.compositeThumbnailUrl ? (
                      <img
                        src={video.compositeThumbnailUrl}
                        alt={video.title ?? "Generated video"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Preview wird vorbereitet
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold leading-tight">
                          {video.title || "Unbenanntes Video"}
                        </h3>
                        {created ? (
                          <p className="text-xs text-muted-foreground">
                            Erstellt am {created}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                          statusStyle,
                        )}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    {video.reactionAvatar?.name ? (
                      <p className="text-xs text-muted-foreground">
                        Avatar: {video.reactionAvatar.name}
                      </p>
                    ) : null}
                    {scheduled ? (
                      <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                        Geplant für {scheduled}
                      </div>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full px-4"
                        onClick={() => handleOpenVideo(video)}
                      >
                        Öffnen
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-full px-4"
                        onClick={() => handleDownload(video)}
                        disabled={!video.compositeVideoUrl}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
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
