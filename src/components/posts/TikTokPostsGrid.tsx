"use client";

import type { ElementType } from "react";

import { format } from "date-fns";
import { CalendarClock, ImageIcon, RefreshCcw, Video } from "lucide-react";

import { TikTokPostStatusBadge } from "@/components/posts/TikTokPostStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { TikTokPostRecord } from "@/hooks/use-tiktok-posts";
import { cn } from "@/lib/utils";

const IonIcon = "ion-icon" as unknown as ElementType;

interface TikTokPostsGridProps {
  title: string;
  posts: TikTokPostRecord[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  emptyMessage: string;
  onRefresh: () => void;
  mode: "posted" | "scheduled";
}

export function TikTokPostsGrid({
  title,
  posts,
  loading,
  refreshing,
  error,
  emptyMessage,
  onRefresh,
  mode,
}: TikTokPostsGridProps) {
  const hasContent = posts.length > 0;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void onRefresh()}
          className="gap-2"
          disabled={loading}
        >
          <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </header>

      {loading && !hasContent ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/30">
          <Spinner text="Loading posts..." />
        </div>
      ) : hasContent ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <TikTokPostCard key={post.id} post={post} mode={mode} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 px-6 py-12 text-center text-sm text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}

interface TikTokPostCardProps {
  post: TikTokPostRecord;
  mode: "posted" | "scheduled";
}

function TikTokPostCard({ post, mode }: TikTokPostCardProps) {
  const referenceDate =
    mode === "scheduled" ? post.runAt ?? post.createdAt : post.updatedAt ?? post.createdAt;

  const { dateLabel, timeLabel } = buildDateTime(referenceDate);
  const caption =
    typeof post.payload.caption === "string" && post.payload.caption.trim().length > 0
      ? post.payload.caption.trim()
      : "No description provided.";

  return (
    <Card className="flex h-full flex-col justify-between border-border/60 p-4">
      <div className="flex items-start justify-between text-xs text-muted-foreground">
        <span>{dateLabel}</span>
        <span>{timeLabel}</span>
      </div>

      <div className="mt-3">
        <MediaPreview media={post.payload.media ?? []} />
      </div>

      <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{caption}</p>

      <div className="mt-6 flex items-center justify-between">
        <PlatformBadge platform={post.platform} />
        <TikTokPostStatusBadge status={post.status} />
      </div>
    </Card>
  );
}

function buildDateTime(value: string | null | undefined): { dateLabel: string; timeLabel: string } {
  if (!value) {
    return {
      dateLabel: "-",
      timeLabel: "-",
    };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      dateLabel: "-",
      timeLabel: "-",
    };
  }

  return {
    dateLabel: format(date, "MMM d, yyyy"),
    timeLabel: format(date, "HH:mm"),
  };
}

interface MediaPreviewProps {
  media: TikTokPostRecord["payload"]["media"];
}

function MediaPreview({ media }: MediaPreviewProps) {
  if (!media || media.length === 0) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 text-muted-foreground">
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {media.slice(0, 3).map((item, index) => (
        <MediaThumb key={`${index}-${item.url ?? "media"}`} media={item} />
      ))}
      {media.length > 3 && (
        <span className="flex h-16 w-16 items-center justify-center rounded-md border border-border/50 bg-muted text-xs font-semibold text-muted-foreground">
          +{media.length - 3}
        </span>
      )}
    </div>
  );
}

interface MediaThumbProps {
  media: NonNullable<TikTokPostRecord["payload"]["media"]>[number];
}

function MediaThumb({ media }: MediaThumbProps) {
  const url = typeof media.url === "string" ? media.url : undefined;
  const isVideo = (media.type ?? "").toLowerCase() === "video";

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-md border border-border/60 bg-muted">
      {url ? (
        <img
          src={url}
          alt="Post media"
          loading="lazy"
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
        </div>
      )}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
          <Video className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const normalized = platform.toLowerCase();

  if (normalized === "tiktok") {
    return (
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <IonIcon name="logo-tiktok" style={{ fontSize: "1.4rem" }} aria-hidden="true" />
          <span className="sr-only">TikTok</span>
        </span>
        TikTok
      </div>
    );
  }

  return (
    <Badge variant="outline" className="text-xs uppercase">
      {platform || "Unknown"}
    </Badge>
  );
}
