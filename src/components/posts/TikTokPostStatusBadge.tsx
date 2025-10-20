"use client";

import { Badge } from "@/components/ui/badge";
import type { TikTokPostStatus } from "@/hooks/use-tiktok-posts";

const STATUS_VARIANTS: Record<TikTokPostStatus, "default" | "secondary" | "destructive" | "outline"> = {
  QUEUE: "secondary",
  SCHEDULED: "secondary",
  RUNNING: "default",
  PUBLISHED: "default",
  INBOX: "default",
  FAILED: "destructive",
  CANCELLED: "outline",
};

const STATUS_LABELS: Record<TikTokPostStatus, string> = {
  QUEUE: "Queued",
  SCHEDULED: "Scheduled",
  RUNNING: "Running",
  PUBLISHED: "Published",
  INBOX: "Inbox",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export function TikTokPostStatusBadge({ status }: { status: TikTokPostStatus }) {
  const label = STATUS_LABELS[status] ?? status;
  const variant = STATUS_VARIANTS[status] ?? "secondary";

  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  );
}
