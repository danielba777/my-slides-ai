"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

type ConnectionState = "idle" | "loading";

export function TikTokConnectionCard() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");

  const handleConnect = useCallback(async () => {
    setConnectionState("loading");

    try {
      const startResponse = await fetch("/api/tiktok/start");
      const startPayload = await startResponse.json().catch(() => null);

      if (!startResponse.ok || !startPayload || typeof startPayload.url !== "string") {
        throw new Error(
          startPayload && typeof startPayload.error === "string"
            ? startPayload.error
            : "Unable to start TikTok OAuth flow",
        );
      }

      window.location.href = startPayload.url;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "TikTok connection failed";
      toast.error(message);
      setConnectionState("idle");
    }
  }, []);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Connect TikTok</CardTitle>
        <CardDescription>
          Link your TikTok account to import and schedule posts directly from SlidesCockpit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          We will redirect you to TikTok to authorize access. After authorizing, you will land back here automatically.
        </p>
      </CardContent>
      <CardFooter>
        <Button
          variant={connectionState === "loading" ? "loading" : "default"}
          onClick={handleConnect}
          disabled={connectionState === "loading"}
        >
          {connectionState === "loading" ? "Connecting..." : "Connect TikTok"}
        </Button>
      </CardFooter>
    </Card>
  );
}
