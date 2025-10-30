"use client";

import { TikTokScheduleForm } from "@/components/tiktok/TikTokScheduleForm";
import { useTikTokScheduleAction } from "@/hooks/use-tiktok-schedule-action";

export default function TikTokScheduleTestPage() {
  const action = useTikTokScheduleAction();

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold">TikTok Scheduling Test</h1>
        <p className="text-muted-foreground">
          Schedule a TikTok post via the SlidesCockpit API and verify the
          background worker flow.
        </p>
      </div>

      <TikTokScheduleForm action={action} />
    </div>
  );
}
