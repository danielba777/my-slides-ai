"use client";

import { useCallback, useEffect, useState } from "react";

export interface ConnectedTikTokAccount {
  openId: string;
  displayName: string | null;
  username: string | null;
  unionId: string | null;
  avatarUrl: string | null;
  connectedAt: string;
}

interface UseTikTokAccountsResult {
  accounts: ConnectedTikTokAccount[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  disconnect: (openId: string) => Promise<boolean>;
}

export function useTikTokAccounts(): UseTikTokAccountsResult {
  const [accounts, setAccounts] = useState<ConnectedTikTokAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tiktok/accounts", { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload && typeof payload.error === "string"
            ? payload.error
            : "Unable to load TikTok accounts";
        throw new Error(message);
      }

      if (Array.isArray(payload)) {
        setAccounts(
          payload.map((item) => ({
            openId: String(item.openId ?? item.id ?? ""),
            displayName: typeof item.displayName === "string" ? item.displayName : null,
            username: typeof item.username === "string" ? item.username : null,
            unionId: typeof item.unionId === "string" ? item.unionId : null,
            avatarUrl: typeof item.avatarUrl === "string" ? item.avatarUrl : null,
            connectedAt:
              typeof item.connectedAt === "string"
                ? item.connectedAt
                : new Date().toISOString(),
          })),
        );
      } else {
        setAccounts([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load TikTok accounts";
      setError(message);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async (openId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tiktok/accounts/${encodeURIComponent(openId)}/disconnect`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload && typeof payload.error === "string"
            ? payload.error
            : "Unable to disconnect TikTok account";
        throw new Error(message);
      }

      
      await refresh();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to disconnect TikTok account";
      setError(message);
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { accounts, loading, error, refresh, disconnect };
}

