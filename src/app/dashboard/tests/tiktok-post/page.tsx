"use client";

import { TikTokPostForm } from "@/components/tiktok/TikTokPostForm";
import { useTikTokPostAction } from "@/hooks/use-tiktok-post-action";

export default function TikTokPostingTestPage() {
  const action = useTikTokPostAction();

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold">TikTok Posting Test</h1>
        <p className="text-muted-foreground">
          Upload an asset through the pre-sign route and trigger a direct
          TikTok post via the connected API flow.
        </p>
      </div>
      <TikTokPostForm action={action} />
    </div>
  );
}
