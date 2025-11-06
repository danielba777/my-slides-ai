"use client";

import { useEffect, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TikTokConfig } from "@/components/tiktok/TikTokConfig";
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
  renderAccountSelector?: boolean;
  onSelectAccount?: (openId: string) => void;
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
  renderAccountSelector = true,
  onSelectAccount,
}: TikTokPostFormProps) {
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
    <Card
      className={cn("w-full bg-transparent border-none shadow-none", className)}
    >
      <CardContent className="space-y-4">
        {renderAccountSelector && (
          <div className="space-y-2">
            <Label>Connected TikTok account</Label>
            <div className="flex items-start gap-3">
              <div className="flex gap-4 overflow-x-auto pb-1">
                {accountsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading accounts…
                  </p>
                ) : accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No TikTok accounts connected.
                  </p>
                ) : (
                  accounts.map((account) => {
                    const label =
                      account.username ?? account.displayName ?? account.openId;
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
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            placeholder="Write the TikTok caption…"
            value={form.caption}
            onChange={(event) => updateField("caption", event.target.value)}
            rows={10}
            className="bg-white"
          />
        </div>

        {/* TikTok Config Section */}
        <TikTokConfig
          title={form.title || ""}
          autoAddMusic={form.autoAddMusic ?? true}
          postMode={form.postMode === "DIRECT_POST" ? "direct_post" : "inbox"}
          onTitleChange={(title) => updateField("title", title)}
          onAutoAddMusicChange={(autoAddMusic) => updateField("autoAddMusic", autoAddMusic)}
          onPostModeChange={(postMode) => updateField("postMode", postMode === "direct_post" ? "DIRECT_POST" : "MEDIA_UPLOAD")}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
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
