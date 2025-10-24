"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  ConnectedTikTokAccount,
  useTikTokAccounts,
} from "@/hooks/use-tiktok-accounts";
import IonIcon from "@reacticons/ionicons";
import { defineCustomElements } from "ionicons/loader";
import { toast } from "sonner";

type ConnectionState = "idle" | "loading";

export function ConnectionCard() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const {
    accounts,
    loading: accountsLoading,
    error,
    refresh,
  } = useTikTokAccounts();

  useEffect(() => {
    if (typeof window !== "undefined") {
      defineCustomElements(window);
    }
  }, []);

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
    <div className="max-w-xl">
      <div className="flex items-center gap-4">
        <IonIcon name="logo-tiktok" size="large" />
        <Button
          variant={connectionState === "loading" ? "loading" : "default"}
          onClick={handleConnect}
          disabled={connectionState === "loading"}
        >
          {connectionState === "loading" ? "Connecting..." : "Connect TikTok"}
        </Button>
        {accountsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner className="h-8 w-8" />
          </div>
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

      <div className="py-4 border-t-2 mt-4">
        <Button
          variant="outline"
          className=""
          onClick={() => void refresh()}
          disabled={accountsLoading}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
