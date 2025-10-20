"use client";

import { TikTokPostsGrid } from "@/components/posts/TikTokPostsGrid";
import { useTikTokPosts } from "@/hooks/use-tiktok-posts";

const SCHEDULED_STATUSES = ["SCHEDULED", "QUEUE", "RUNNING"] as const;

export default function ScheduledPostsPage() {
  const { posts, loading, refreshing, error, refetch } = useTikTokPosts({
    statuses: SCHEDULED_STATUSES.slice(),
    refetchIntervalMs: 5_000,
  });

  return (
    <div className="w-full px-10 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Scheduled TikToks</h1>
        <p className="text-sm text-muted-foreground">
          Monitor upcoming TikTok posts scheduled through SlidesCockpit and track queue, running, and pending jobs in real time.
        </p>
      </div>

      <TikTokPostsGrid
        title="Upcoming Schedule"
        posts={posts}
        loading={loading}
        refreshing={refreshing && !loading}
        error={error}
        emptyMessage="No TikTok videos are scheduled yet. Schedule a post and it will appear here straight away."
        onRefresh={refetch}
        mode="scheduled"
      />
    </div>
  );
}
