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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { type UseTikTokScheduleActionResult } from "@/hooks/use-tiktok-schedule-action";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface TikTokScheduleFormProps {
  action: UseTikTokScheduleActionResult;
  className?: string;
  cardTitle?: string;
  submitLabel?: string;
  refreshLabel?: string;
  showRefreshButton?: boolean;
  showSubmitButton?: boolean;
  showPublishControls?: boolean;
}

export function TikTokScheduleForm({
  action,
  className,
  cardTitle = "Schedule post",
  submitLabel = "Schedule TikTok post",
  refreshLabel = "Refresh accounts",
  showRefreshButton = true,
  showSubmitButton = true,
  showPublishControls = true,
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
    setForm((prev) => {
      if (prev.photoImages.length === 0 && prev.coverIndex !== 0) {
        return { ...prev, coverIndex: 0 };
      }
      if (
        prev.photoImages.length > 0 &&
        prev.coverIndex >= prev.photoImages.length
      ) {
        return { ...prev, coverIndex: 0 };
      }
      return prev;
    });
  }, [form.photoImages.length, setForm]);

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
          {showRefreshButton && (
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
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="schedule-title">Title</Label>
          <Input
            id="schedule-title"
            placeholder="Optional title"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {showPublishControls && (
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
          )}
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
      {showRefreshButton && (
        <CardFooter className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => void refreshAccounts()}
            disabled={accountsLoading}
          >
            {refreshLabel}
          </Button>
        </CardFooter>
      )}
      {showSubmitButton && (
        <CardFooter className="mt-0 flex items-center gap-4">
          <Button
            onClick={() => void handleSubmit()}
            disabled={
              submitting ||
              accountsLoading ||
              accounts.length === 0 ||
              form.photoImages.length === 0
            }
          >
            {submitting ? "Scheduling…" : submitLabel}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
