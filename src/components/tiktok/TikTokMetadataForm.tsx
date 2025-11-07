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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { InfoIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export interface TikTokMetadata {
  title: string;
  privacyLevel: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  isBrandedContent: boolean;
  brandOption: "MY_BRAND" | "THIRD_PARTY" | null;
}

export interface CreatorInfo {
  privacy_level_options: string[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
}

interface TikTokMetadataFormProps {
  initialData?: Partial<TikTokMetadata>;
  onSubmit: (metadata: TikTokMetadata) => void;
  loading?: boolean;
  openId: string;
}

const DEFAULT_METADATA: TikTokMetadata = {
  title: "",
  privacyLevel: "PUBLIC_TO_EVERYONE",
  disableComment: false,
  disableDuet: false,
  disableStitch: false,
  isBrandedContent: false,
  brandOption: null,
};

export function TikTokMetadataForm({
  initialData,
  onSubmit,
  loading = false,
  openId,
}: TikTokMetadataFormProps) {
  const { toast } = useToast();
  const [metadata, setMetadata] = useState<TikTokMetadata>({
    ...DEFAULT_METADATA,
    ...initialData,
  });

  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null);
  const [loadingCreatorInfo, setLoadingCreatorInfo] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load creator info on component mount
  useEffect(() => {
    const loadCreatorInfo = async () => {
      try {
        const response = await fetch(`/api/tiktok/creator-info/${encodeURIComponent(openId)}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setCreatorInfo(data);

        // Set initial privacy level to first available option if not set
        if (!metadata.privacyLevel && data.privacy_level_options?.length > 0) {
          setMetadata(prev => ({
            ...prev,
            privacyLevel: data.privacy_level_options[0]
          }));
        }

        // Set initial interaction states based on creator info
        setMetadata(prev => ({
          ...prev,
          disableComment: prev.disableComment || data.comment_disabled,
          disableDuet: prev.disableDuet || data.duet_disabled,
          disableStitch: prev.disableStitch || data.stitch_disabled,
        }));

      } catch (error) {
        console.error("Failed to load creator info:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to load account info. Please try again later.",
        });
      } finally {
        setLoadingCreatorInfo(false);
      }
    };

    if (openId) {
      loadCreatorInfo();
    }
  }, [openId, toast, metadata.privacyLevel]);

  const updateMetadata = <K extends keyof TikTokMetadata>(
    key: K,
    value: TikTokMetadata[K]
  ) => {
    setMetadata(prev => ({ ...prev, [key]: value }));

    // Clear errors for this field
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate title
    if (!metadata.title.trim()) {
      newErrors.title = "Caption is required";
    } else if (metadata.title.length > 150) {
      newErrors.title = "Caption must be less than 150 characters";
    }

    // Validate privacy level
    if (!creatorInfo?.privacy_level_options.includes(metadata.privacyLevel)) {
      newErrors.privacyLevel = "Please select a valid visibility from the options for your account";
    }

    // Validate branded content privacy constraint
    if (metadata.isBrandedContent && metadata.privacyLevel === "SELF_ONLY") {
      newErrors.brandedPrivacy = "Branded content cannot be private; visibility will be set to Public";
      // Auto-correct the privacy level
      if (creatorInfo?.privacy_level_options.includes("PUBLIC_TO_EVERYONE")) {
        updateMetadata("privacyLevel", "PUBLIC_TO_EVERYONE");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(metadata);
  };

  if (loadingCreatorInfo) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-3">
            <Spinner className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">Loading account settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!creatorInfo) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load account information. Please refresh the page and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>TikTok Post Settings</CardTitle>
        <CardDescription>
          Configure your post settings before publishing to TikTok
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Caption/Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Caption</Label>
            <Input
              id="title"
              placeholder="Enter your caption here..."
              value={metadata.title}
              onChange={(e) => updateMetadata("title", e.target.value)}
              disabled={loading}
              maxLength={150}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {metadata.title.length}/150 characters
            </p>
          </div>

          {/* Privacy Level */}
          <div className="space-y-2">
            <Label htmlFor="privacyLevel">Who can see this post</Label>
            <Select
              value={metadata.privacyLevel}
              onValueChange={(value) => updateMetadata("privacyLevel", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {creatorInfo.privacy_level_options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                disabled={loading || creatorInfo.comment_disabled}
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
                disabled={loading || creatorInfo.duet_disabled}
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
                disabled={loading || creatorInfo.stitch_disabled}
              />
            </div>

            {/* Show disabled features info */}
            {(creatorInfo.comment_disabled || creatorInfo.duet_disabled || creatorInfo.stitch_disabled) && (
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
            <Label>Commercial Content</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="brandedContent">This post includes commercial content</Label>
                <p className="text-xs text-muted-foreground">
                  Disclose if this is branded content or a promotion
                </p>
              </div>
              <Switch
                id="brandedContent"
                checked={metadata.isBrandedContent}
                onCheckedChange={(checked) => updateMetadata("isBrandedContent", checked)}
                disabled={loading}
              />
            </div>

            {metadata.isBrandedContent && (
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="myBrand"
                    checked={metadata.brandOption === "MY_BRAND"}
                    onCheckedChange={(checked) =>
                      updateMetadata("brandOption", checked ? "MY_BRAND" : null)
                    }
                    disabled={loading}
                  />
                  <Label htmlFor="myBrand" className="text-sm">
                    My Brand (promoting your own brand)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="thirdParty"
                    checked={metadata.brandOption === "THIRD_PARTY"}
                    onCheckedChange={(checked) =>
                      updateMetadata("brandOption", checked ? "THIRD_PARTY" : null)
                    }
                    disabled={loading}
                  />
                  <Label htmlFor="thirdParty" className="text-sm">
                    Branded Content (third-party promotion)
                  </Label>
                </div>

                <p className="text-xs text-muted-foreground">
                  By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation.
                </p>
              </div>
            )}

            {errors.brandedPrivacy && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  {errors.brandedPrivacy}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Publishing..." : "Post to TikTok"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}