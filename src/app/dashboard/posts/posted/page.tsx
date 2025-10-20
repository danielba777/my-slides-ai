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
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Posted TikToks</h1>
        <p className="text-sm text-muted-foreground">
          Every TikTok published via SlidesCockpit, including drafts kept in inbox and failed attempts for quick follow-up.
        </p>
      </div>

      <TikTokPostsGrid
        title="Latest Activity"
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
