"use client";

import { useEffect, type ComponentProps } from "react";

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
import { type UseTikTokPostActionResult } from "@/hooks/use-tiktok-post-action";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface TikTokPostFormProps {
  action: UseTikTokPostActionResult;
  className?: string;
  cardTitle?: string;
  submitLabel?: string;
  refreshLabel?: string;
  disableRefreshButton?: boolean;
  footer?: ComponentProps<typeof CardFooter>["children"];
}

export function TikTokPostForm({
  action,
  className,
  cardTitle = "Configure post",
  submitLabel = "Trigger TikTok post",
  refreshLabel = "Refresh accounts",
  disableRefreshButton = false,
  footer,
}: TikTokPostFormProps) {
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
            <Label htmlFor="openId">Connected TikTok account</Label>
            <select
              id="openId"
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
          disabled={
            disableRefreshButton || accountsLoading || accounts.length === 0
          }
          className="self-end"
          onClick={() => void refreshAccounts()}
          title={refreshLabel}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          <span className="sr-only">{refreshLabel}</span>
        </Button>
      </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Optional title"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            placeholder="Write the TikTok caption…"
            value={form.caption}
            onChange={(event) => updateField("caption", event.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-3">
          <Label>Slides to post</Label>
          <p className="text-xs text-muted-foreground">
            TikTok uses the first image as the cover. Select a slide to move it to the front.
          </p>
          {form.photoImages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No slide images were prepared for this presentation.
            </p>
          ) : (
            <div className="space-y-3">
              {form.photoImages.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="flex items-center gap-3 rounded-md border border-border/70 p-3"
                >
                  <input
                    type="radio"
                    name="coverIndex"
                    className="h-4 w-4"
                    checked={form.coverIndex === index}
                    onChange={() => updateField("coverIndex", index)}
                    aria-label={`Set slide ${index + 1} as cover`}
                  />
                  <div className="flex items-center gap-3">
                    <div className="h-28 w-20 overflow-hidden rounded-md border bg-muted">
                      <img
                        src={url}
                        alt={`Slide ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">Slide {index + 1}</span>
                      <code className="text-xs break-all text-muted-foreground">
                        {url}
                      </code>
                      {form.coverIndex === index && (
                        <span className="text-xs text-primary font-semibold">
                          Selected cover
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <div className="space-y-2 rounded-md border border-muted p-3 text-sm">
            <p>
              <span className="font-semibold">Publish ID:</span>{" "}
              {result.publishId}
            </p>
            {result.postId && (
              <p>
                <span className="font-semibold">Post ID:</span> {result.postId}
              </p>
            )}
            {result.releaseUrl ? (
              <p>
                <span className="font-semibold">Release URL:</span>{" "}
                <a
                  href={result.releaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  {result.releaseUrl}
                </a>
              </p>
            ) : (
              <p className="text-muted-foreground">
                No release URL available — TikTok does not return a URL for
                Inbox posts.
              </p>
            )}
            <p>
              <span className="font-semibold">Status:</span> {result.status}
            </p>
            {result.error && (
              <p className="text-sm text-destructive">
                <span className="font-semibold">Error:</span> {result.error}
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-4">
        <Button
          onClick={() => void handleSubmit()}
          disabled={
            submitting ||
            accountsLoading ||
            accounts.length === 0 ||
            form.photoImages.length === 0
          }
        >
          {submitting ? "Posting & polling…" : submitLabel}
        </Button>
        {!disableRefreshButton && (
          <Button
            variant="outline"
            onClick={() => void refreshAccounts()}
            disabled={accountsLoading}
          >
            {refreshLabel}
          </Button>
        )}
        {footer}
      </CardFooter>
    </Card>
  );
}
