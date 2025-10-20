"use client";

import { useMemo } from "react";

import { format, formatDistanceToNow } from "date-fns";
import { CalendarClock, ImageIcon, RefreshCcw, Video } from "lucide-react";

import { TikTokPostStatusBadge } from "@/components/posts/TikTokPostStatusBadge";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TikTokPostRecord } from "@/hooks/use-tiktok-posts";
import { cn } from "@/lib/utils";

interface TikTokPostsTableProps {
  title: string;
  posts: TikTokPostRecord[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  emptyMessage: string;
  onRefresh: () => void;
  mode: "posted" | "scheduled";
}

export function TikTokPostsTable({
  title,
  posts,
  loading,
  refreshing,
  error,
  emptyMessage,
  onRefresh,
  mode,
}: TikTokPostsTableProps) {
  const sorted = useMemo(() => {
    const key = mode === "scheduled" ? "runAt" : "updatedAt";
    return [...posts].sort((a, b) => {
      const left = a[key as keyof TikTokPostRecord];
      const right = b[key as keyof TikTokPostRecord];
      const leftTime = typeof left === "string" ? Date.parse(left) : Date.parse(a.createdAt);
      const rightTime = typeof right === "string" ? Date.parse(right) : Date.parse(b.createdAt);
      return rightTime - leftTime;
    });
  }, [posts, mode]);

  const hasContent = sorted.length > 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
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
      </CardHeader>
      <CardContent>
        {loading && !hasContent ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-md border border-dashed border-muted-foreground/30">
            <Spinner text="Loading TikTok posts..." />
          </div>
        ) : hasContent ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[200px]">Caption</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>{mode === "scheduled" ? "Run at" : "Updated"}</TableHead>
                <TableHead>{mode === "scheduled" ? "Job ID" : "Publish ID"}</TableHead>
                {mode === "scheduled" ? <TableHead>Attempts</TableHead> : <TableHead>Output</TableHead>}
                <TableHead>Media</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <TikTokPostStatusBadge status={post.status} />
                    {post.status === "FAILED" && post.lastError ? (
                      <p className="mt-1 max-w-xs text-xs text-destructive">{post.lastError}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-2 text-sm">{post.payload.caption ?? "-"}</p>
                    {mode === "posted" && post.publishId && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Saved {formatDistanceToNowSafe(post.updatedAt)} ago
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[11px] uppercase">
                      {truncateOpenId(post.targetOpenId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DateBadge value={mode === "scheduled" ? post.runAt : post.updatedAt} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {mode === "scheduled" ? post.jobId ?? "-" : post.publishId ?? "-"}
                  </TableCell>
                  {mode === "scheduled" ? (
                    <TableCell>{post.attempts}</TableCell>
                  ) : (
                    <TableCell>
                      {post.resultUrl ? (
                        <a
                          href={post.resultUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline-offset-2 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <MediaSummary media={post.payload.media ?? []} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </CardContent>
    </Card>
  );
}

function truncateOpenId(openId: string): string {
  if (openId.length <= 12) return openId;
  return `${openId.slice(0, 6)}...${openId.slice(-4)}`;
}

function formatDateSafe(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy HH:mm");
}

function formatDistanceToNowSafe(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return formatDistanceToNow(date, { addSuffix: false });
}

function DateBadge({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground">
      <CalendarClock className="h-3 w-3" />
      {formatDateSafe(value)}
    </span>
  );
}

function MediaSummary({ media }: { media: TikTokPostRecord["payload"]["media"] }) {
  if (!media || media.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const videos = media.filter((item) => item.type === "video").length;
  const photos = media.filter((item) => item.type === "photo").length;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {videos > 0 && (
        <span className="inline-flex items-center gap-1">
          <Video className="h-3 w-3" />
          {videos}
        </span>
      )}
      {photos > 0 && (
        <span className="inline-flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          {photos}
        </span>
      )}
      {videos === 0 && photos === 0 && (
        <span className="text-xs text-muted-foreground">Custom media</span>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/30 py-12 text-center text-sm text-muted-foreground">
      <p>{message}</p>
    </div>
  );
}
