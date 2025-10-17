"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type ConnectStatus = "idle" | "processing" | "success" | "error";

export default function TikTokCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConnectStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      setStatus("error");
      setErrorMessage("Missing TikTok authorization parameters.");
      return;
    }

    const connect = async () => {
      setStatus("processing");

      try {
        const response = await fetch("/api/tiktok/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            state,
            timezone: String(-new Date().getTimezoneOffset()),
          }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            payload && typeof payload.error === "string"
              ? payload.error
              : "TikTok connection failed",
          );
        }

        setStatus("success");
        toast.success("TikTok account connected");
        setTimeout(() => {
          router.replace("/dashboard/connections");
        }, 1500);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "TikTok connection failed";
        setErrorMessage(message);
        toast.error(message);
        setStatus("error");
      }
    };

    void connect();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      {status === "processing" && (
        <>
          <Spinner text="Connecting your TikTok account..." />
          <p className="text-sm text-muted-foreground">
            This will only take a moment.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="text-2xl font-semibold">TikTok connected</h1>
          <p className="text-sm text-muted-foreground">
            Redirecting you back to your connections&hellip;
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-2xl font-semibold">Connection failed</h1>
          <p className="text-sm text-muted-foreground">
            {errorMessage ??
              "We could not connect your TikTok account. Please try again."}
          </p>
          <Button onClick={() => router.replace("/dashboard/connections")}>
            Back to connections
          </Button>
        </>
      )}
    </div>
  );
}
