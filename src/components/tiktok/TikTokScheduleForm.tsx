"use client";

import { useEffect } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  TikTokSchedulePayload,
  type UseTikTokScheduleActionResult,
} from "@/hooks/use-tiktok-schedule-action";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface TikTokScheduleFormProps {
  action: UseTikTokScheduleActionResult;
  className?: string;
  cardTitle?: string;
  submitLabel?: string;
  refreshLabel?: string;
  lockedMediaType?: TikTokSchedulePayload["mediaType"];
}

export function TikTokScheduleForm({
  action,
  className,
  cardTitle = "Schedule post",
  submitLabel = "Schedule TikTok post",
  refreshLabel = "Refresh accounts",
  lockedMediaType,
}: TikTokScheduleFormProps) {
  const {
    form,
    setForm,
    updateField,
    submitting,
    result,
    error,
    handleSubmit,
    accounts,
    accountsLoading,
    refreshAccounts,
    resetIdempotencyKey,
  } = action;

  useEffect(() => {
    if (!lockedMediaType) return;
    setForm((prev) => {
      if (
        prev.mediaType === lockedMediaType &&
        (lockedMediaType !== "photo" ||
          (prev.postMode === "INBOX" &&
            prev.contentPostingMethod === "MEDIA_UPLOAD"))
      ) {
        return prev;
      }
      const next: TikTokSchedulePayload = {
        ...prev,
        mediaType: lockedMediaType,
      };
      if (lockedMediaType === "photo") {
        next.postMode = "INBOX";
        next.contentPostingMethod = "MEDIA_UPLOAD";
        next.thumbnailTimestampMs = undefined;
      }
      return next;
    });
  }, [lockedMediaType, setForm]);

  const mediaTypeLabel =
    form.mediaType === "photo" ? "Photo (Carousel)" : "Video";

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <Label htmlFor="schedule-openId">Connected TikTok account</Label>
            <select
              id="schedule-openId"
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={accountsLoading || accounts.length === 0}
              value={form.openId}
              onChange={(event) => updateField("openId", event.target.value)}
            >
              {accountsLoading && <option>Loading accounts…</option>}
              {!accountsLoading && accounts.length === 0 && (
                <option>No TikTok accounts connected</option>
              )}
              {accounts.map((account) => {
                const label =
                  account.username ?? account.displayName ?? account.openId;
                return (
                  <option key={account.openId} value={account.openId}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
          <Button
            variant="ghost"
            size="icon"
            disabled={accountsLoading || accounts.length === 0}
            className="self-end"
            onClick={() => void refreshAccounts()}
            title={refreshLabel}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            <span className="sr-only">{refreshLabel}</span>
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule-mediaUrl">Media URL</Label>
          <Input
            id="schedule-mediaUrl"
            placeholder="https://files.slidescockpit.com/..."
            value={form.mediaUrl}
            onChange={(event) => updateField("mediaUrl", event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="schedule-mediaType">Media type</Label>
            {lockedMediaType ? (
              <Input
                id="schedule-mediaType"
                value={mediaTypeLabel}
                readOnly
                disabled
                className="h-10"
              />
            ) : (
              <select
                id="schedule-mediaType"
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.mediaType}
                onChange={(event) => {
                  const nextType =
                    event.target.value as TikTokSchedulePayload["mediaType"];
                  setForm((prev) => ({
                    ...prev,
                    mediaType: nextType,
                    postMode:
                      nextType === "photo"
                        ? "INBOX"
                        : prev.postMode === "INBOX" ||
                            prev.postMode === "MEDIA_UPLOAD"
                          ? "PUBLISH"
                          : prev.postMode,
                    contentPostingMethod:
                      nextType === "photo"
                        ? "MEDIA_UPLOAD"
                        : prev.contentPostingMethod === "MEDIA_UPLOAD"
                          ? "UPLOAD"
                          : prev.contentPostingMethod,
                  }));
                }}
              >
                <option value="photo">Photo (Carousel)</option>
                <option value="video">Video</option>
              </select>
            )}
          </div>
          {form.mediaType === "video" && (
            <div className="space-y-2">
              <Label htmlFor="schedule-thumbnailTimestamp">
                Thumbnail timestamp (ms)
              </Label>
              <Input
                id="schedule-thumbnailTimestamp"
                type="number"
                value={form.thumbnailTimestampMs ?? ""}
                onChange={(event) =>
                  updateField(
                    "thumbnailTimestampMs",
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                  )
                }
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="schedule-postMode">Post mode</Label>
            <select
              id="schedule-postMode"
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.postMode}
              onChange={(event) =>
                updateField(
                  "postMode",
                  event.target.value as TikTokSchedulePayload["postMode"],
                )
              }
            >
              <option value="INBOX">Inbox (Draft)</option>
              <option value="PUBLISH">Direct Publish</option>
              <option value="MEDIA_UPLOAD">TikTok Media Upload</option>
              <option value="DIRECT_POST">TikTok Direct Post</option>
            </select>
            <p className="text-sm text-muted-foreground">
              Inbox sends the post to TikTok drafts. Choose PUBLISH or DIRECT_POST
              to publish immediately.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-postingMethod">Posting method</Label>
            <select
              id="schedule-postingMethod"
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.contentPostingMethod}
              onChange={(event) =>
                updateField(
                  "contentPostingMethod",
                  event.target
                    .value as TikTokSchedulePayload["contentPostingMethod"],
                )
              }
            >
              <option value="UPLOAD">Upload (Videos)</option>
              <option value="MEDIA_UPLOAD">Media Upload (Inbox/Drafts)</option>
              <option value="DIRECT_POST">Direct Post</option>
              <option value="URL">Pull from URL</option>
            </select>
            <p className="text-sm text-muted-foreground">
              Choose a method that matches the selected post mode. MEDIA_UPLOAD
              is required for Inbox drafts.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="schedule-publishAt">Publish time (UTC)</Label>
            <Input
              id="schedule-publishAt"
              type="datetime-local"
              value={form.publishAt}
              onChange={(event) => updateField("publishAt", event.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Values are sent to the API as UTC timestamps.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-idempotencyKey">Idempotency key</Label>
            <div className="flex gap-2">
              <Input
                id="schedule-idempotencyKey"
                value={form.idempotencyKey}
                onChange={(event) =>
                  updateField("idempotencyKey", event.target.value)
                }
              />
              <Button
                type="button"
                variant="secondary"
                onClick={resetIdempotencyKey}
              >
                New
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Reusing keys prevents duplicate jobs in the queue.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule-caption">Caption</Label>
          <Textarea
            id="schedule-caption"
            placeholder="Write the TikTok caption…"
            value={form.caption}
            onChange={(event) => updateField("caption", event.target.value)}
            rows={4}
          />
        </div>

        <div className="flex items-start gap-3 rounded-md border border-dashed border-border/70 p-3">
          <Switch
            id="schedule-autoMusic"
            checked={form.autoAddMusic}
            onCheckedChange={(checked) => updateField("autoAddMusic", checked)}
          />
          <div>
            <Label htmlFor="schedule-autoMusic" className="font-medium">
              Add music automatically
            </Label>
            <p className="text-sm text-muted-foreground">
              Enabled by default so TikTok can select background music.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <div className="space-y-2 rounded-md border border-muted p-3 text-sm">
            <p>
              <span className="font-semibold">Scheduled:</span>{" "}
              {result.scheduled ? "Yes" : "No"}
            </p>
            <p>
              <span className="font-semibold">Run at:</span> {result.runAt}
            </p>
            <p>
              <span className="font-semibold">Job key:</span> {result.jobKey}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-4">
        <Button
          onClick={() => void handleSubmit()}
          disabled={submitting || accountsLoading || accounts.length === 0}
        >
          {submitting ? "Scheduling…" : submitLabel}
        </Button>
        <Button
          variant="outline"
          onClick={() => void refreshAccounts()}
          disabled={accountsLoading}
        >
          {refreshLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
