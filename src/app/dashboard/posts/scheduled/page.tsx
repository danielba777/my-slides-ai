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
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">Scheduled</h1>
      </header>

      <TikTokPostsGrid
        title=""
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
