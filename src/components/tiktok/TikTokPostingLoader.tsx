"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface TikTokPostingLoaderProps {
  publishId: string;
  openId: string;
  caption: string;
  onComplete?: (status: string, postId?: string, releaseUrl?: string) => void;
  onError?: (error: string) => void;
  onBack?: () => void;
}

interface PostStatus {
  status: "processing" | "success" | "failed" | "inbox";
  postId?: string;
  releaseUrl?: string;
  error?: string;
  publishId: string;
}

export function TikTokPostingLoader({
  publishId,
  openId,
  caption,
  onComplete,
  onError,
  onBack
}: TikTokPostingLoaderProps) {
  const router = useRouter();
  const [status, setStatus] = useState<PostStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // Poll the status every 2 seconds
  useEffect(() => {
    if (!publishId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/tiktok/post-status/${encodeURIComponent(openId)}/${encodeURIComponent(publishId)}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as PostStatus;
        setStatus(data);
        setPollCount(prev => prev + 1);

        console.log(`[TikTokPostingLoader] Poll ${pollCount + 1}:`, data);

        // Check if we have a final status
        if (data.status === "success" || data.status === "inbox" || data.status === "failed") {
          setLoading(false);
          onComplete?.(data.status, data.postId, data.releaseUrl);

          // Auto-redirect after successful post
          if (data.status === "success" || data.status === "inbox") {
            setTimeout(() => {
              router.push("/dashboard/posts/posted");
            }, 1500);
          }
        }

      } catch (err) {
        console.error("[TikTokPostingLoader] Poll error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to check post status";
        setError(errorMessage);
        setLoading(false);

        // Show error as toast notification
        toast.error(errorMessage);

        onError?.(errorMessage);
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval
    const interval = setInterval(pollStatus, 2000);

    // Cleanup after 2 minutes max (60 polls * 2 seconds)
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setLoading(false);
      const timeoutMessage = "Post status check timed out. Please check your TikTok app.";
      setError(timeoutMessage);

      // Show timeout error as toast notification
      toast.error(timeoutMessage);

      onError?.(timeoutMessage);
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [publishId, onComplete, onError, router, pollCount]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-16 w-16 text-orange-600" />
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md">
            We couldn't check your post status. Please try again or check your TikTok app.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
          >
            Try Again
          </Button>
          <Button onClick={() => router.push("/dashboard/create/slideshow")}>
            Back to Create Post
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      {loading && (
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-16 w-16" />
          <h2 className="text-2xl font-semibold">Posting on TikTok</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Please don't refresh or close this page.
          </p>
        </div>
      )}

      {!loading && status && (
        <div className="flex flex-col items-center gap-3">
          {status.status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600" />
              <h2 className="text-2xl font-semibold text-green-600">Post Published!</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Your post has been successfully published to TikTok.
              </p>
              {status.releaseUrl && (
                <Button
                  variant="outline"
                  onClick={() => window.open(status.releaseUrl, "_blank")}
                >
                  View on TikTok
                </Button>
              )}
            </>
          )}

          {status.status === "inbox" && (
            <>
              <Clock className="h-16 w-16 text-blue-600" />
              <h2 className="text-2xl font-semibold text-blue-600">Sent to Inbox</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Your post has been sent to your TikTok inbox for review.
                Please check your TikTok app to approve and publish.
              </p>
            </>
          )}

          {status.status === "failed" && (
            <>
              <XCircle className="h-16 w-16 text-destructive" />
              <h2 className="text-2xl font-semibold text-destructive">Post Failed</h2>
              <p className="text-muted-foreground text-center max-w-md">
                {status.error || "Your post could not be published to TikTok."}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}