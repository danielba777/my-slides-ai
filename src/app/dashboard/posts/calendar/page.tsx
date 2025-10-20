"use client";

import { useMemo, useState, type ElementType } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import type { View } from "react-calendar/dist/shared/types.js";

import {
  useTikTokPosts,
  type TikTokPostRecord,
  type TikTokPostStatus,
} from "@/hooks/use-tiktok-posts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Camera, Image } from "lucide-react";

const TILE_CLASS =
  "rounded-md text-sm font-medium transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

const STATUS_TILE_STYLES: Record<TikTokPostStatus, string> = {
  QUEUE: "bg-blue-100 text-blue-900 dark:bg-blue-900/70 dark:text-blue-100",
  SCHEDULED:
    "bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-100",
  RUNNING:
    "bg-purple-100 text-purple-900 dark:bg-purple-900/70 dark:text-purple-100",
  PUBLISHED:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100",
  INBOX: "bg-sky-100 text-sky-900 dark:bg-sky-900/70 dark:text-sky-100",
  FAILED: "bg-rose-100 text-rose-900 dark:bg-rose-900/70 dark:text-rose-100",
  CANCELLED:
    "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-100",
};

const IonIcon = "ion-icon" as unknown as ElementType;

export default function PostsCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { posts, loading, error, refetch } = useTikTokPosts({
    refetchIntervalMs: 10_000,
  });

  const postsByDate = useMemo(() => {
    const map = new Map<string, TikTokPostRecord[]>();
    posts.forEach((post) => {
      const date = derivePostDate(post);
      if (!date) return;
      const key = format(date, "yyyy-MM-dd");
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(post);
    });
    return map;
  }, [posts]);

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">Calendar</h1>
      </header>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="w-full flex-1 rounded-xl p-2 shadow-sm sm:p-4">
        <Calendar
          value={selectedDate}
          onChange={(value) => {
            if (value instanceof Date) setSelectedDate(value);
          }}
          locale="en-US"
          minDetail="month"
          maxDetail="month"
          prev2Label={null}
          next2Label={null}
          selectRange={false}
          tileClassName={({ date, view }) =>
            cn(
              TILE_CLASS,
              view === "month" &&
                selectedDate.toDateString() === date.toDateString()
                ? "border-primary bg-primary text-primary-foreground"
                : postsByDate.has(format(date, "yyyy-MM-dd"))
                  ? "border border-primary/50 text-foreground"
                  : "text-foreground",
            )
          }
          tileContent={({ date, view }) =>
            renderTileContent(date, view, postsByDate)
          }
          className="posts-calendar h-full w-full text-foreground"
        />
      </div>

      <style jsx global>{`
        .posts-calendar {
          font-family: inherit;
          width: 100% !important;
          max-width: none !important;
        }
        .posts-calendar .react-calendar {
          width: 100% !important;
          max-width: none !important;
        }
        .posts-calendar .react-calendar {
          height: 100%;
        }
        .posts-calendar .react-calendar__viewContainer {
          height: 100%;
        }
        .posts-calendar .react-calendar__month-view {
          height: 100%;
        }
        .posts-calendar .react-calendar__navigation {
          margin-bottom: 1rem;
        }
        .posts-calendar .react-calendar__tile {
          min-width: 0;
          /* Make tiles much taller, responsive to viewport height */
          min-height: clamp(120px, 12vh, 220px);
          padding: 0.5rem;
          border-radius: 0.75rem;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-start;
        }
        .posts-calendar .react-calendar__tile:disabled {
          background-color: transparent;
        }
        .posts-calendar .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-size: 0.7rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
        }
        .posts-calendar
          .react-calendar__month-view__days__day--neighboringMonth {
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
}

function derivePostDate(post: TikTokPostRecord): Date | null {
  const scheduledStatuses: TikTokPostStatus[] = [
    "SCHEDULED",
    "QUEUE",
    "RUNNING",
  ];
  const dateSource =
    scheduledStatuses.includes(post.status) && post.runAt
      ? post.runAt
      : (post.updatedAt ?? post.createdAt ?? post.runAt);

  if (!dateSource) return null;
  const date = new Date(dateSource);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function renderTileContent(
  date: Date,
  tileView: View,
  postsByDate: Map<string, TikTokPostRecord[]>,
) {
  if (tileView !== "month") return null;
  const key = format(date, "yyyy-MM-dd");
  const posts = postsByDate.get(key);
  if (!posts || posts.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-1">
      {posts.slice(0, 3).map((post) => (
        <div
          key={post.id}
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-medium text-foreground shadow-sm",
            STATUS_TILE_STYLES[post.status],
          )}
        >
          <div className="flex items-center justify-between text-[10px] font-semibold opacity-80">
            <span>{formatPostTime(post)}</span>
            <MediaTypeIcon mediaType={inferMediaType(post)} />
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-medium">
            <PlatformIcon platform={post.platform} />
            <span className="truncate">
              {truncateCaption(post.payload.caption)}
            </span>
          </div>
        </div>
      ))}
      {posts.length > 3 ? (
        <span className="text-[10px] text-muted-foreground">
          +{posts.length - 3} more
        </span>
      ) : null}
    </div>
  );
}

function formatPostTime(post: TikTokPostRecord) {
  const date = derivePostDate(post);
  if (!date) return "--:--";
  return format(date, "HH:mm");
}

function truncateCaption(caption?: string | null) {
  if (!caption) return "No description";
  if (caption.length <= 40) return caption;
  return `${caption.slice(0, 37)}...`;
}

function inferMediaType(post: TikTokPostRecord) {
  const firstMedia = post.payload.media?.[0];
  if (!firstMedia) return "unknown";
  const type = (firstMedia.type ?? "").toString().toLowerCase();
  if (type.includes("video")) return "video";
  if (type.includes("photo") || type.includes("image")) return "image";
  return "unknown";
}

function MediaTypeIcon({ mediaType }: { mediaType: string }) {
  if (mediaType === "video") {
    return <Camera className="h-3 w-3" aria-hidden="true" />;
  }
  if (mediaType === "image") {
    return <Image className="h-3 w-3" aria-hidden="true" />;
  }
  return <span className="text-[10px]">--</span>;
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform.toLowerCase() === "tiktok") {
    return (
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-black/90 text-white">
        <IonIcon
          name="logo-tiktok"
          style={{ fontSize: "0.75rem" }}
          aria-hidden="true"
        />
      </span>
    );
  }
  return (
    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-muted text-[8px] font-bold text-foreground">
      {platform.slice(0, 2).toUpperCase()}
    </span>
  );
}
