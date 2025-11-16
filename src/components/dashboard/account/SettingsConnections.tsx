"use client";
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
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
type ConnectionState = "idle" | "loading";
export default function SettingsConnections() {
  const [state, setState] = useState<ConnectionState>("idle");
  const [disconnectingOpenId, setDisconnectingOpenId] = useState<string | null>(
    null,
  );
  
  const { accounts, loading, error, refresh, disconnect } = useTikTokAccounts();

  useEffect(() => {
    if (typeof window !== "undefined") defineCustomElements(window);
  }, []);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const sorted = useMemo(() => {
    const list = [...(accounts ?? [])];
    return list.sort(
      (a, b) =>
        new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime(),
    );
  }, [accounts]);

  const connect = useCallback(async () => {
    setState("loading");
    try {
      const r = await fetch("/api/tiktok/start");
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.url)
        throw new Error(j?.error ?? "Unable to start TikTok OAuth flow");
      window.location.href = j.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "TikTok connection failed");
      setState("idle");
    }
  }, []);

  const handleDisconnect = useCallback(
    async (account: ConnectedTikTokAccount) => {
      if (disconnectingOpenId === account.openId) return;

      const accountLabel = labelFor(account);

      if (
        !window.confirm(
          `Are you sure you want to disconnect "${accountLabel}" from SlidesCockpit?`,
        )
      ) {
        return;
      }

      setDisconnectingOpenId(account.openId);

      try {
        const success = await disconnect(account.openId);
        if (success) {
          toast.success(`Disconnected "${accountLabel}" from SlidesCockpit`);
        } else {
          toast.error(`Failed to disconnect "${accountLabel}"`);
        }
      } catch (error) {
        toast.error(`Failed to disconnect "${accountLabel}"`);
      } finally {
        setDisconnectingOpenId(null);
      }
    },
    [disconnect, disconnectingOpenId],
  );

  const labelFor = (a: ConnectedTikTokAccount) =>
    a.username ??
    a.displayName ??
    (a.unionId ? `ID ${a.unionId.slice(0, 8)}` : null) ??
    `ID ${a.openId.slice(0, 8)}`;

  const initialsFor = (a: ConnectedTikTokAccount) => {
    const label = labelFor(a).trim();
    const letters = label.replace(/[^A-Za-z0-9]/g, "");
    if (letters.length === 0) return "TT";
    return letters.slice(0, 2).toUpperCase();
  };

  return (
    <div className="px-1 md:px-2 py-1 md:py-2 space-y-4">
      {}
      <div className="mb-2">
        <h2 className="text-xl md:text-2xl font-semibold">Connections</h2>
        <p className="text-sm text-muted-foreground">
          Link your TikTok account to publish and schedule.
        </p>
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Badge className="border-[#304674]/20 bg-[#304674]/10 px-3 py-1 text-[#304674] hover:bg-[#304674]/10 hover:text-[#304674] cursor-default transition-none">
          <span className="inline-flex items-center gap-2">
            <IonIcon name="logo-tiktok" />
            TikTok connected: {accounts?.length ?? 0}
          </span>
        </Badge>
        <div className="w-full max-w-xs md:w-auto">
          <Button
            className="w-full rounded-xl bg-[#304674] text-white"
            variant={state === "loading" ? "loading" : "default"}
            onClick={connect}
            disabled={state === "loading"}
          >
            {state === "loading" ? "Connecting..." : "Connect TikTok"}
          </Button>
        </div>
      </div>

      {}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Spinner className="h-8 w-8" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border px-4 py-3 text-sm text-muted-foreground">
          No TikTok accounts connected yet.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {[...(accounts || [])]
            .slice()
            .sort((a, b) => labelFor(a).localeCompare(labelFor(b)))
            .map((a) => (
              <Badge
                key={a.openId}
                className="relative inline-flex items-center gap-2 border px-2 py-1 pr-6 cursor-default transition-none"
              >
                <Avatar className="h-5 w-5 border">
                  <AvatarImage src={a.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {initialsFor(a)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{labelFor(a)}</span>

                {}
                <button
                  onClick={() => handleDisconnect(a)}
                  disabled={disconnectingOpenId === a.openId}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-red-100 text-red-600 opacity-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Disconnect ${labelFor(a)}`}
                >
                  {disconnectingOpenId === a.openId ? (
                    <Spinner className="h-2 w-2" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
}
