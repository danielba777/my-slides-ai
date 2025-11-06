"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";

interface TikTokConfigProps {
  title?: string;
  autoAddMusic?: boolean;
  postMode?: "inbox" | "direct_post";
  onTitleChange?: (title: string) => void;
  onAutoAddMusicChange?: (autoAddMusic: boolean) => void;
  onPostModeChange?: (postMode: "inbox" | "direct_post") => void;
}

export function TikTokConfig({
  title = "",
  autoAddMusic = true,
  postMode = "inbox",
  onTitleChange,
  onAutoAddMusicChange,
  onPostModeChange,
}: TikTokConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange?.(event.target.value);
  };

  const handleAutoAddMusicChange = (checked: boolean) => {
    onAutoAddMusicChange?.(checked);
  };

  const handlePostModeChange = (mode: "inbox" | "direct_post") => {
    onPostModeChange?.(mode);
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between gap-2"
      >
        <span className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          TikTok Config
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isExpanded && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="tiktok-title">Title (Optional)</Label>
            <Input
              id="tiktok-title"
              placeholder="Enter a title for your TikTok post..."
              value={title}
              onChange={handleTitleChange}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use caption as title (recommended for photos)
            </p>
          </div>

          {/* Auto Music Toggle */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Label htmlFor="auto-music">Auto Music</Label>
              <p className="text-xs text-muted-foreground">
                Automatically add background music to photo posts
              </p>
            </div>
            <Switch
              id="auto-music"
              checked={autoAddMusic}
              onCheckedChange={handleAutoAddMusicChange}
            />
          </div>

          {/* Post Mode Selection */}
          <div className="space-y-2">
            <Label>Post Mode</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={postMode === "inbox" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePostModeChange("inbox")}
                className="flex-1"
              >
                Inbox
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                className="flex-1 relative"
              >
                Auto Publish
                <span className="absolute -top-2 -right-2 rounded-full bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5">
                  Coming Soon
                </span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Post will be sent to your TikTok inbox for manual review and publishing
            </p>
          </div>
        </div>
      )}
    </div>
  );
}