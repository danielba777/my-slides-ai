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
import toast from "react-hot-toast";

interface TikTokScheduleFormProps {
  action: UseTikTokScheduleActionResult;
  className?: string;
  cardTitle?: string;
  submitLabel?: string;
  refreshLabel?: string;
  showRefreshButton?: boolean;
  showSubmitButton?: boolean;
  showPublishControls?: boolean;
  renderAccountSelector?: boolean;
  onSelectAccount?: (openId: string) => void;
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
  renderAccountSelector = true,
  onSelectAccount,
}: TikTokScheduleFormProps) {
  const {
    form,
    setForm,
    updateField,
    submitting,
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

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderAccountSelector && (
          <div className="space-y-2">
            <Label>Connected TikTok account</Label>
            <div className="flex items-start gap-3">
              <div className="flex gap-4 overflow-x-auto pb-1">
                {accountsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading accounts…</p>
                ) : accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No TikTok accounts connected.
                  </p>
                ) : (
                  accounts.map((account) => {
                    const label = account.username ?? account.displayName ?? account.openId;
                    const isSelected = form.openId === account.openId;
                    const initials = label
                      .split(" ")
                      .map((part) => part[0]?.toUpperCase())
                      .join("")
                      .slice(0, 2);

                    const handleSelect = () => {
                      if (onSelectAccount) {
                        onSelectAccount(account.openId);
                      } else {
                        updateField("openId", account.openId);
                      }
                    };

                    return (
                      <button
                        key={account.openId}
                        type="button"
                        onClick={handleSelect}
                        className="flex flex-col items-center gap-2"
                        aria-pressed={isSelected}
                      >
                        <span
                          className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all ${isSelected ? "border-primary" : "border-border"}`}
                        >
                          {account.avatarUrl ? (
                            <img
                              src={account.avatarUrl}
                              alt={label}
                              className={`h-14 w-14 rounded-full object-cover transition-all ${isSelected ? "" : "grayscale opacity-70"}`}
                            />
                          ) : (
                            <span
                              className={`flex h-14 w-14 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground transition-all ${isSelected ? "text-primary" : ""}`}
                            >
                              {initials || "TikTok"}
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-xs ${isSelected ? "font-semibold" : "text-muted-foreground"}`}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              {showRefreshButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={accountsLoading}
                  className="mt-1"
                  onClick={() => void refreshAccounts()}
                  title={refreshLabel}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  <span className="sr-only">{refreshLabel}</span>
                </Button>
              )}
            </div>
          </div>
        )}
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
        {/* Errors are displayed via toast notifications */}
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
