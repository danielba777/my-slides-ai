"use client";

import { useEffect, type ChangeEvent, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TikTokConfig } from "@/components/tiktok/TikTokConfig";
import { type UseTikTokPostActionResult } from "@/hooks/use-tiktok-post-action";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const CAPTION_LIMIT = 4000;

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

  
  const canPost = typeof window !== 'undefined' ?
    ((window as any).__tiktokCanPost !== false && (window as any).__tiktokMetadataValid !== false) : true;
  const postLimitReason = typeof window !== 'undefined' ? (window as any).__tiktokPostLimitReason : null;

  
  const handleValidatedSubmit = () => {
    
    const metadata = typeof window !== 'undefined' ? (window as any).__tiktokMetadata : null;
    if (!metadata || !metadata.privacyLevel) {
      toast.error("Please select who can see this post before posting.");
      return;
    }

    
    void handleSubmit();
  };

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

  useEffect(() => {
    if (postLimitReason) {
      toast.error(`Posting restricted: ${postLimitReason}`);
    }
  }, [postLimitReason]);

  const captionCharCount = form.caption.length;

  const handleCaptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const limitedValue = event.target.value.slice(0, CAPTION_LIMIT);
    updateField("caption", limitedValue);
  };

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
            onChange={handleCaptionChange}
            rows={10}
            className="bg-white"
          />
          <p
            className={cn(
              "text-xs text-right",
              captionCharCount > CAPTION_LIMIT ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {captionCharCount}/{CAPTION_LIMIT}
          </p>
        </div>

        {}
        <TikTokConfig
          title={form.title || ""}
          autoAddMusic={form.autoAddMusic ?? true}
          openId={form.openId}
          onTitleChange={(title) => updateField("title", title)}
          onAutoAddMusicChange={(autoAddMusic) => updateField("autoAddMusic", autoAddMusic)}
          onMetadataChange={(metadata) => {
            
            
            if (typeof window !== 'undefined') {
              (window as any).__tiktokMetadata = metadata;
            }
          }}
          onPostLimitChange={(canPost, reason) => {
            
            if (typeof window !== 'undefined') {
              (window as any).__tiktokCanPost = canPost;
              (window as any).__tiktokPostLimitReason = reason;
            }
          }}
        />
        {}
      </CardContent>
      {}
      {showSubmitButton && (
        <CardFooter className="mt-0 flex items-center gap-4">
          <Button
            onClick={handleValidatedSubmit}
            disabled={
              submitting ||
              accountsLoading ||
              accounts.length === 0 ||
              form.photoImages.length === 0 ||
              !canPost
            }
          >
            {submitting ? "Posting & polling…" : submitLabel}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
