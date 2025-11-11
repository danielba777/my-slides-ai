"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, InfoIcon, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface TikTokConfigProps {
  title?: string;
  autoAddMusic?: boolean;
  onTitleChange?: (title: string) => void;
  onAutoAddMusicChange?: (autoAddMusic: boolean) => void;
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
  onTitleChange,
  onAutoAddMusicChange,
  onMetadataChange,
  onPostLimitChange,
  openId,
}: TikTokConfigProps) {
  const TITLE_LIMIT = 90;
  const DEFAULT_PRIVACY_OPTIONS = [
    "PUBLIC_TO_EVERYONE",
    "MUTUAL_FOLLOW_FRIENDS",
    "FOLLOWER_OF_CREATOR",
    "SELF_ONLY",
  ] as const;

  const [isExpanded, setIsExpanded] = useState(false);

  // Metadata state
  const [metadata, setMetadata] = useState({
    privacyLevel: "", // No default selection as required by checklist
    disableComment: false,
    disableDuet: true,
    disableStitch: true,
    isCommercialContent: false,
    brandOption: null as "YOUR_BRAND" | "BRANDED_CONTENT" | "BOTH" | null,
  });

  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null);
  const [loadingCreatorInfo, setLoadingCreatorInfo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [postLimitError, setPostLimitError] = useState<string | null>(null);
  const [privacyOptions, setPrivacyOptions] = useState<string[]>([
    ...DEFAULT_PRIVACY_OPTIONS,
  ]);

  // Load creator info when component mounts or openId changes
  useEffect(() => {
    if (!openId) return;

    const loadCreatorInfo = async () => {
      setLoadingCreatorInfo(true);
      try {
        const response = await fetch(
          `/api/tiktok/creator-info/${encodeURIComponent(openId)}`,
        );

        if (!response.ok) {
          // Use fallback if API is not available
          const defaultCreatorInfo: CreatorInfo = {
            privacy_level_options: [...DEFAULT_PRIVACY_OPTIONS],
            comment_disabled: false,
            duet_disabled: false,
            stitch_disabled: false,
          };
          setCreatorInfo(defaultCreatorInfo);
          setPrivacyOptions([...DEFAULT_PRIVACY_OPTIONS]);
        } else {
          const data = await response.json();
          setCreatorInfo(data);
          if (
            Array.isArray(data.privacy_level_options) &&
            data.privacy_level_options.length > 0
          ) {
            setPrivacyOptions(data.privacy_level_options);
          } else {
            setPrivacyOptions([...DEFAULT_PRIVACY_OPTIONS]);
          }

          // Check post limits
          if (data.post_limits && !data.post_limits.can_post) {
            const reason =
              data.post_limits.reason ||
              "You cannot make more posts at this time. Please try again later.";
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
          privacy_level_options: [...DEFAULT_PRIVACY_OPTIONS],
          comment_disabled: false,
          duet_disabled: false,
          stitch_disabled: false,
          post_limits: { can_post: true },
        };
        setCreatorInfo(defaultCreatorInfo);
        setPrivacyOptions([...DEFAULT_PRIVACY_OPTIONS]);
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
    if (typeof window !== "undefined") {
      (window as any).__tiktokMetadataValid = isValid;
    }
  }, [metadata, onMetadataChange]);

  const updateMetadata = (key: string, value: any) => {
    setMetadata((prev) => {
      const newMetadata = { ...prev, [key]: value };

      // Validate commercial content rules
      const newErrors: Record<string, string> = {};

      // Check if privacy level is selected
      if (!newMetadata.privacyLevel) {
        newErrors.privacyLevel = "Please select who can see this post.";
      }

      // Check privacy constraints for branded content
      const brandedContentSelected =
        newMetadata.brandOption === "BRANDED_CONTENT" ||
        newMetadata.brandOption === "BOTH";

      if (
        newMetadata.isCommercialContent &&
        brandedContentSelected &&
        newMetadata.privacyLevel === "SELF_ONLY"
      ) {
        newErrors.privacyConstraint =
          "Branded content cannot be set to private. Visibility has been switched to Public.";
        // Auto-correct privacy level
        newMetadata.privacyLevel = "PUBLIC_TO_EVERYONE";
      }

      setErrors(newErrors);
      return newMetadata;
    });
  };

  const formatPrivacyLevel = (level: string): string => {
    const labelMap: Record<string, string> = {
      PUBLIC_TO_EVERYONE: "Public",
      MUTUAL_FOLLOW_FRIENDS: "Mutual Friends",
      FOLLOWER_OF_CREATOR: "Followers",
      SELF_ONLY: "Only Me",
    };
    return (
      labelMap[level] ||
      level
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const limitedValue = event.target.value.slice(0, TITLE_LIMIT);
    onTitleChange?.(limitedValue);
  };

  const handleAutoAddMusicChange = (checked: boolean) => {
    onAutoAddMusicChange?.(checked);
  };

  const yourBrandSelected =
    metadata.brandOption === "YOUR_BRAND" || metadata.brandOption === "BOTH";
  const brandedContentSelected =
    metadata.brandOption === "BRANDED_CONTENT" ||
    metadata.brandOption === "BOTH";

  const resolveBrandOption = (
    yourBrand: boolean,
    brandedContent: boolean,
  ): "YOUR_BRAND" | "BRANDED_CONTENT" | "BOTH" | null => {
    if (yourBrand && brandedContent) {
      return "BOTH";
    }
    if (yourBrand) {
      return "YOUR_BRAND";
    }
    if (brandedContent) {
      return "BRANDED_CONTENT";
    }
    return null;
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
            <p
              className={cn(
                "text-xs text-right",
                title.length > TITLE_LIMIT
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {title.length}/{TITLE_LIMIT}
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
                {privacyOptions.map((option) => {
                  const isDisabled =
                    metadata.isCommercialContent &&
                    brandedContentSelected &&
                    option === "SELF_ONLY";
                  return (
                    <SelectItem
                      key={option}
                      value={option}
                      disabled={isDisabled}
                      className={
                        isDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }
                    >
                      {formatPrivacyLevel(option)}
                      {isDisabled && " (Not available for branded content)"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.privacyConstraint && (
              <p className="text-sm text-orange-600">
                {errors.privacyConstraint}
              </p>
            )}
          </div>

          {/* Interaction Options */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Allow users to</Label>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  id="allowComments"
                  checked={!metadata.disableComment}
                  onCheckedChange={(checked) =>
                    updateMetadata("disableComment", !checked)
                  }
                  disabled={creatorInfo?.comment_disabled}
                />
                <Label htmlFor="allowComments" className="text-sm font-medium">
                  Comment
                </Label>
              </div>
            </div>
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

          {/* Commercial Content Disclosure */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Disclose post content</p>
                <p className="text-xs text-muted-foreground">
                  Turn on to disclose that this post promotes goods or services
                  in exchange for something of value. Your post could promote
                  yourself, a third party, or both.
                </p>
              </div>
              <Switch
                id="commercialContent"
                checked={metadata.isCommercialContent}
                onCheckedChange={(checked) =>
                  updateMetadata("isCommercialContent", checked)
                }
              />
            </div>

            {metadata.isCommercialContent && (
              <div className="space-y-4">
                {metadata.brandOption && (
                  <Alert className="flex items-center gap-3 [&>svg]:relative [&>svg]:top-0 [&>svg]:left-0 [&>svg~*]:pl-0 [&>svg+div]:translate-y-0">
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      {metadata.brandOption === "YOUR_BRAND"
                        ? `Your photo will be labeled as "Promotional content".`
                        : `Your photo will be labeled as "Paid partnership".`}{" "}
                      This cannot be changed once your post is posted.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Your Brand</p>
                      <p className="text-xs text-muted-foreground">
                        You are promoting yourself or your own business. This
                        video will be classified as Brand Organic.
                      </p>
                    </div>
                    <Checkbox
                      id="yourBrand"
                      checked={yourBrandSelected}
                      onCheckedChange={(checked) =>
                        updateMetadata(
                          "brandOption",
                          resolveBrandOption(
                            checked === true,
                            brandedContentSelected,
                          ),
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Branded content</p>
                      <p className="text-xs text-muted-foreground">
                        You are promoting another brand or a third party. This
                        post will be classified as Branded Content.
                      </p>
                    </div>
                    <Checkbox
                      id="brandedContent"
                      checked={brandedContentSelected}
                      onCheckedChange={(checked) =>
                        updateMetadata(
                          "brandOption",
                          resolveBrandOption(
                            yourBrandSelected,
                            checked === true,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
