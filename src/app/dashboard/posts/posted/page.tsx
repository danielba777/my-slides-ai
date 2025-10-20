"use client";

import { TikTokPostsGrid } from "@/components/posts/TikTokPostsGrid";
import { useTikTokPosts } from "@/hooks/use-tiktok-posts";

const POSTED_STATUSES = ["PUBLISHED", "INBOX", "FAILED"] as const;

export default function PostedPostsPage() {
  const { posts, loading, refreshing, error, refetch } = useTikTokPosts({
    statuses: POSTED_STATUSES.slice(),
    refetchIntervalMs: 5_000,
  });

  return (
    <div className="w-full px-10 py-12 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">Posted</h1>
      </header>

      <TikTokPostsGrid
        title=""
        posts={posts}
        loading={loading}
        refreshing={refreshing && !loading}
        error={error}
        emptyMessage="No TikTok posts yet. Publish your first video to see it here instantly."
        onRefresh={refetch}
        mode="posted"
      />
    </div>
  );
}
