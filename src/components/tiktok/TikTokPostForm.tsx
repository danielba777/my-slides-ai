"use client";

import { useEffect, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
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
import { type UseTikTokPostActionResult } from "@/hooks/use-tiktok-post-action";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface TikTokPostFormProps {
  action: UseTikTokPostActionResult;
  className?: string;
  cardTitle?: string;
  submitLabel?: string;
  refreshLabel?: string;
  showRefreshButton?: boolean;
  footer?: ComponentProps<typeof CardFooter>["children"];
  showSubmitButton?: boolean;
}

export function TikTokPostForm({
  action,
  className,
  cardTitle = "Configure post",
  submitLabel = "Trigger TikTok post",
  refreshLabel = "Refresh accounts",
  showRefreshButton = true,
  footer,
  showSubmitButton = true,
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
      {/*
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
        {showRefreshButton && (
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
      */}
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
            {submitting ? "Posting & polling…" : submitLabel}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
