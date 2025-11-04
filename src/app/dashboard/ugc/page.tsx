"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useTikTokAccounts } from "@/hooks/use-tiktok-accounts";
import { cn } from "@/lib/utils";
import type { DemoVideo, GeneratedVideo, ReactionAvatar } from "@/types/ugc";
import { RefreshCw, Settings, VideoOff } from "lucide-react";

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
    const activeVideo = dialogState.video;
    if (!activeVideo) return;
    if (!scheduleAccountId) {
      toast.error("Connect a TikTok account first");
      return;
    }
    try {
      setScheduleSubmitting(true);
      const response = await fetch(
        `/api/ugc/videos/${activeVideo.id}/schedule`,
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
          item.id === activeVideo.id
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

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">Create UGC ads</h1>
        <p className="text-sm text-muted-foreground">
          Combine reaction avatars with your product demos and render shareable
          videos instantly.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* LEFT COLUMN: preview, avatars, demos */}
        <div className="space-y-6">
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Preview</CardTitle>
              <p className="text-xs text-muted-foreground">
                Preview will render here.
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
                Select an avatar and demo to preview the composition.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                1. Reaction avatars
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Select a reaction avatar to use in the composition.
              </p>
            </CardHeader>
            <CardContent>
              {avatarsLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : avatars.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                  No reaction avatars yet. Add them via the admin panel.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                  {avatars.map((avatar) => {
                    const isActive = selectedAvatarId === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatarId(avatar.id)}
                        className={cn(
                          "group relative aspect-[3/4] overflow-hidden rounded-xl border transition",
                          isActive
                            ? "border-primary shadow-md"
                            : "border-transparent hover:border-muted",
                        )}
                      >
                        <img
                          src={avatar.thumbnailUrl}
                          alt={avatar.name}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="truncate text-xs font-medium text-white">
                            {avatar.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold">3. Demos</CardTitle>
              <p className="text-xs text-muted-foreground">
                Choose your product demo or add new demos in Settings.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-xl"
                >
                  <Link href="/dashboard/account/settings?tab=demos">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage demos
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void loadDemos()}
                  className="rounded-xl"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {demosLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDemoId("none")}
                    className={cn(
                      "flex h-20 flex-col items-center justify-center gap-2 rounded-xl border transition",
                      selectedDemoId === "none"
                        ? "border-primary bg-primary/5"
                        : "border-dashed border-muted-foreground/40 hover:border-muted-foreground/70",
                    )}
                  >
                    <VideoOff className="h-5 w-5" />
                    <span className="text-xs font-medium">None</span>
                  </button>
                  {demos.map((demo) => {
                    const isActive = selectedDemoId === demo.id;
                    return (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => setSelectedDemoId(demo.id)}
                        className={cn(
                          "group relative h-20 overflow-hidden rounded-xl border transition",
                          isActive
                            ? "border-primary shadow-sm"
                            : "border-transparent hover-border-muted",
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />
                        <video
                          src={demo.videoUrl}
                          className="h-full w-full object-cover"
                          muted
                        />
                        <div className="absolute inset-x-0 bottom-0 px-2 pb-2 text-left">
                          <p className="truncate text-xs font-semibold text-white">
                            {demo.name || "Demo"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: composition preview + actions */}
        <div className="space-y-6">
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Preview</CardTitle>
              <p className="text-xs text-muted-foreground">
                Preview will render here.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
                <div className="aspect-[9/16] overflow-hidden rounded-xl border">
                  {selectedAvatar ? (
                    <img
                      src={selectedAvatar.thumbnailUrl}
                      alt={selectedAvatar.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                      Select a reaction avatar
                    </div>
                  )}
                </div>
                <div className="grid gap-4">
                  <div className="aspect-video overflow-hidden rounded-xl border bg-black">
                    {selectedDemo ? (
                      <video
                        key={selectedDemo.id}
                        src={selectedDemo.videoUrl}
                        className="h-full w-full object-cover"
                        muted
                        autoPlay
                        loop
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No demo selected
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full rounded-full"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating || !selectedAvatar}
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        Generating...
                      </span>
                    ) : (
                      "Generate reaction + demo"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <div className="rounded-2xl border px-4 py-10 text-center text-sm text-muted-foreground">
              My videos will appear here once generated.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
