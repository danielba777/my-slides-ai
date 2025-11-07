"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDown, ChevronUp, Settings, InfoIcon } from "lucide-react";
import toast from "react-hot-toast";

interface TikTokConfigProps {
  title?: string;
  autoAddMusic?: boolean;
  postMode?: "inbox" | "direct_post";
  onTitleChange?: (title: string) => void;
  onAutoAddMusicChange?: (autoAddMusic: boolean) => void;
  onPostModeChange?: (postMode: "inbox" | "direct_post") => void;
  onMetadataChange?: (metadata: any) => void;
  onPostLimitChange?: (canPost: boolean, reason?: string) => void;
  openId?: string;
}

interface CreatorInfo {
  privacy_level_options: string[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
  post_limits?: {
    can_post: boolean;
    reason?: string;
  };
}

export function TikTokConfig({
  title = "",
  autoAddMusic = true,
  postMode = "inbox",
  onTitleChange,
  onAutoAddMusicChange,
  onPostModeChange,
  onMetadataChange,
  onPostLimitChange,
  openId,
}: TikTokConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Metadata state
  const [metadata, setMetadata] = useState({
    privacyLevel: "", // No default selection as required by checklist
    disableComment: false,
    disableDuet: false,
    disableStitch: false,
    isCommercialContent: false,
    brandOption: null as "YOUR_BRAND" | "BRANDED_CONTENT" | null,
  });

  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null);
  const [loadingCreatorInfo, setLoadingCreatorInfo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [postLimitError, setPostLimitError] = useState<string | null>(null);

  // Load creator info when component mounts or openId changes
  useEffect(() => {
    if (!openId) return;

    const loadCreatorInfo = async () => {
      setLoadingCreatorInfo(true);
      try {
        const response = await fetch(`/api/tiktok/creator-info/${encodeURIComponent(openId)}`);

        if (!response.ok) {
          // Use fallback if API is not available
          const defaultCreatorInfo: CreatorInfo = {
            privacy_level_options: ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY"],
            comment_disabled: false,
            duet_disabled: false,
            stitch_disabled: false,
          };
          setCreatorInfo(defaultCreatorInfo);
        } else {
          const data = await response.json();
          setCreatorInfo(data);

          // Check post limits
          if (data.post_limits && !data.post_limits.can_post) {
            const reason = data.post_limits.reason || "You cannot make more posts at this time. Please try again later.";
            setPostLimitError(reason);
            onPostLimitChange?.(false, reason);
          } else {
            setPostLimitError(null);
            onPostLimitChange?.(true);
          }
        }
      } catch (error) {
        console.error("Failed to load creator info:", error);
        // Use fallback
        const defaultCreatorInfo: CreatorInfo = {
          privacy_level_options: ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY"],
          comment_disabled: false,
          duet_disabled: false,
          stitch_disabled: false,
          post_limits: { can_post: true },
        };
        setCreatorInfo(defaultCreatorInfo);
        setPostLimitError(null);
        onPostLimitChange?.(true);
      } finally {
        setLoadingCreatorInfo(false);
      }
    };

    loadCreatorInfo();
  }, [openId]);

  // Update parent component when metadata changes
  useEffect(() => {
    // Check if metadata is valid for posting
    const isValid =
      metadata.privacyLevel !== "" && // Privacy level must be selected
      (!metadata.isCommercialContent || metadata.brandOption !== null); // If commercial content, brand option must be selected

    onMetadataChange?.(metadata);

    // Also inform about validation status
    if (typeof window !== 'undefined') {
      (window as any).__tiktokMetadataValid = isValid;
    }
  }, [metadata, onMetadataChange]);

  const updateMetadata = (key: string, value: any) => {
    setMetadata(prev => {
      const newMetadata = { ...prev, [key]: value };

      // Validate commercial content rules
      const newErrors: Record<string, string> = {};

      // Check if privacy level is selected
      if (!newMetadata.privacyLevel) {
        newErrors.privacyLevel = "Please select who can see this post.";
      }

      // Check if commercial content is enabled but no brand option selected
      if (newMetadata.isCommercialContent && !newMetadata.brandOption) {
        newErrors.brandOption = "You must select either 'Your Brand' or 'Branded Content' to proceed.";
      }

      // Check privacy constraints for branded content
      if (newMetadata.isCommercialContent && newMetadata.brandOption === "BRANDED_CONTENT" && newMetadata.privacyLevel === "SELF_ONLY") {
        newErrors.privacyConstraint = "Branded content cannot be set to private. Visibility has been switched to Public.";
        // Auto-correct privacy level
        newMetadata.privacyLevel = "PUBLIC_TO_EVERYONE";
      }

      setErrors(newErrors);
      return newMetadata;
    });
  };

  const formatPrivacyLevel = (level: string): string => {
    const labelMap: Record<string, string> = {
      "PUBLIC_TO_EVERYONE": "Public",
      "MUTUAL_FOLLOW_FRIENDS": "Mutual Friends",
      "FOLLOWER_OF_CREATOR": "Followers",
      "SELF_ONLY": "Only Me"
    };
    return labelMap[level] || level.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

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
          {/* Post Limit Error Alert */}
          {postLimitError && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription className="text-orange-600 font-medium">
                Posting Restricted: {postLimitError}
              </AlertDescription>
            </Alert>
          )}
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

          {/* Privacy Level */}
          <div className="space-y-2">
            <Label>Who can see this post</Label>
            <Select
              value={metadata.privacyLevel}
              onValueChange={(value) => updateMetadata("privacyLevel", value)}
              disabled={loadingCreatorInfo}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {(creatorInfo?.privacy_level_options || [
                  "PUBLIC_TO_EVERYONE",
                  "MUTUAL_FOLLOW_FRIENDS",
                  "FOLLOWER_OF_CREATOR",
                  "SELF_ONLY"
                ]).map((option) => {
                  const isDisabled = metadata.isCommercialContent && metadata.brandOption === "BRANDED_CONTENT" && option === "SELF_ONLY";
                  return (
                    <SelectItem
                      key={option}
                      value={option}
                      disabled={isDisabled}
                      className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {formatPrivacyLevel(option)}
                      {isDisabled && " (Not available for branded content)"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.privacyConstraint && (
              <p className="text-sm text-orange-600">{errors.privacyConstraint}</p>
            )}
            {errors.privacyLevel && (
              <p className="text-sm text-destructive">{errors.privacyLevel}</p>
            )}
          </div>

          {/* Interaction Options */}
          <div className="space-y-4">
            <Label>Interaction Options</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowComments">Allow Comments</Label>
                <p className="text-xs text-muted-foreground">
                  Let others comment on your post
                </p>
              </div>
              <Switch
                id="allowComments"
                checked={!metadata.disableComment}
                onCheckedChange={(checked) => updateMetadata("disableComment", !checked)}
                disabled={creatorInfo?.comment_disabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowDuet">Allow Duet</Label>
                <p className="text-xs text-muted-foreground">
                  Let others create duets with your post
                </p>
              </div>
              <Switch
                id="allowDuet"
                checked={!metadata.disableDuet}
                onCheckedChange={(checked) => updateMetadata("disableDuet", !checked)}
                disabled={creatorInfo?.duet_disabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowStitch">Allow Stitch</Label>
                <p className="text-xs text-muted-foreground">
                  Let others stitch your content
                </p>
              </div>
              <Switch
                id="allowStitch"
                checked={!metadata.disableStitch}
                onCheckedChange={(checked) => updateMetadata("disableStitch", !checked)}
                disabled={creatorInfo?.stitch_disabled}
              />
            </div>

            {/* Show disabled features info */}
            {(creatorInfo?.comment_disabled || creatorInfo?.duet_disabled || creatorInfo?.stitch_disabled) && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Some interaction features are disabled for this account by TikTok.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Commercial Content Disclosure */}
          <div className="space-y-4">
            <Label>Commercial Content Disclosure</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="commercialContent">This post includes commercial content or brand promotion</Label>
                <p className="text-xs text-muted-foreground">
                  Disclose if this promotes a brand, product, or service
                </p>
              </div>
              <Switch
                id="commercialContent"
                checked={metadata.isCommercialContent}
                onCheckedChange={(checked) => updateMetadata("isCommercialContent", checked)}
              />
            </div>

            {metadata.isCommercialContent && (
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <p className="text-sm font-medium">Select the type of promotion:</p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="yourBrand"
                    checked={metadata.brandOption === "YOUR_BRAND"}
                    onCheckedChange={(checked) =>
                      updateMetadata("brandOption", checked ? "YOUR_BRAND" : null)
                    }
                  />
                  <Label htmlFor="yourBrand" className="text-sm">
                    Your Brand (you promote your own business)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="brandedContent"
                    checked={metadata.brandOption === "BRANDED_CONTENT"}
                    onCheckedChange={(checked) =>
                      updateMetadata("brandOption", checked ? "BRANDED_CONTENT" : null)
                    }
                  />
                  <Label htmlFor="brandedContent" className="text-sm">
                    Branded Content (you promote someone else's brand)
                  </Label>
                </div>

                {errors.brandOption && (
                  <p className="text-sm text-destructive">{errors.brandOption}</p>
                )}

                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {metadata.brandOption === "YOUR_BRAND"
                      ? "By posting, you agree to TikTok's Music Usage Confirmation."
                      : metadata.brandOption === "BRANDED_CONTENT"
                      ? "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation. If both options are selected, your content will be labeled as 'Paid partnership'."
                      : "Please select one of the options above to proceed."
                    }
                  </p>
                </div>
              </div>
            )}
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
                variant={postMode === "direct_post" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePostModeChange("direct_post")}
                className="flex-1"
              >
                Auto Publish
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {postMode === "inbox"
                ? "Post will be sent to your TikTok inbox for manual review and publishing"
                : "Post will be published directly to your TikTok account"
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}