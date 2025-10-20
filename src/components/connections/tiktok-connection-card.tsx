"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  ConnectedTikTokAccount,
  useTikTokAccounts,
} from "@/hooks/use-tiktok-accounts";

type ConnectionState = "idle" | "loading";

export function TikTokConnectionCard() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const { accounts, loading: accountsLoading, error, refresh } = useTikTokAccounts();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort(
        (a, b) =>
          new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime(),
      ),
    [accounts],
  );

  const handleConnect = useCallback(async () => {
    setConnectionState("loading");

    try {
      const startResponse = await fetch("/api/tiktok/start");
      const startPayload = await startResponse.json().catch(() => null);

      if (
        !startResponse.ok ||
        !startPayload ||
        typeof startPayload.url !== "string"
      ) {
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

  const renderAccountLabel = useCallback((account: ConnectedTikTokAccount) => {
    return (
      account.username ??
      account.displayName ??
      (account.unionId ? `ID ${account.unionId.slice(0, 8)}` : null) ??
      `ID ${account.openId.slice(0, 8)}`
    );
  }, []);

  const renderAccountInitials = useCallback(
    (account: ConnectedTikTokAccount) => {
      const label = renderAccountLabel(account).trim();
      const letters = label.replace(/[^A-Za-z0-9]/g, "");
      if (letters.length === 0) {
        return "TT";
      }
      return letters.slice(0, 2).toUpperCase();
    },
    [renderAccountLabel],
  );

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Connect TikTok</CardTitle>
        <CardDescription>
          Link your TikTok account to import and schedule posts directly from
          SlidesCockpit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We will redirect you to TikTok to authorize access. After authorizing,
          you will land back here automatically.
        </p>

        <div className="space-y-2">
          <p className="text-sm font-medium">Connected TikTok accounts</p>
          {accountsLoading ? (
            <p className="text-sm text-muted-foreground">Loading accounts…</p>
          ) : sortedAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No TikTok accounts connected yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedAccounts.map((account) => (
                <Badge
                  key={account.openId}
                  variant="secondary"
                  className="flex items-center gap-2 pr-3"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      alt={renderAccountLabel(account)}
                      src={account.avatarUrl ?? undefined}
                    />
                    <AvatarFallback className="text-[10px]">
                      {renderAccountInitials(account)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">
                    {renderAccountLabel(account)}
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant={connectionState === "loading" ? "loading" : "default"}
          onClick={handleConnect}
          disabled={connectionState === "loading"}
        >
          {connectionState === "loading" ? "Connecting..." : "Connect TikTok"}
        </Button>
        <Button
          variant="outline"
          className="ml-2"
          onClick={() => void refresh()}
          disabled={accountsLoading}
        >
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
