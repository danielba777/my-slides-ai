Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/app/dashboard/account/settings/SettingsConnections.tsx
+/\*

- - Connections panel – single-file implementation (mirrors the style of Profile & Billing).
- - - Header row with compact badge on the left and primary action on the right
- - - Clean card body without extra inner borders/headers
- - - No refresh button; auto error toast via hook
- \*/
  +"use client";
- +import { useCallback, useEffect, useMemo, useState } from "react";
  +import { Badge } from "@/components/ui/badge";
  +import { Button } from "@/components/ui/button";
  +import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
  +import { Spinner } from "@/components/ui/spinner";
  +import {
- ConnectedTikTokAccount,
- useTikTokAccounts,
  +} from "@/hooks/use-tiktok-accounts";
  +import IonIcon from "@reacticons/ionicons";
  +import { defineCustomElements } from "ionicons/loader";
  +import { toast } from "sonner";
- +type ConnectionState = "idle" | "loading";
- +export default function SettingsConnections() {
- const [state, setState] = useState<ConnectionState>("idle");
- const { accounts, loading, error } = useTikTokAccounts();
-
- useEffect(() => {
- if (typeof window !== "undefined") defineCustomElements(window);
- }, []);
-
- useEffect(() => {
- if (error) toast.error(error);
- }, [error]);
-
- const sorted = useMemo(
- () =>
-      [...accounts].sort(
-        (a, b) =>
-          new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime(),
-      ),
- [accounts],
- );
-
- const connect = useCallback(async () => {
- setState("loading");
- try {
-      const r = await fetch("/api/tiktok/start");
-      const j = await r.json().catch(() => null);
-      if (!r.ok || !j?.url)
-        throw new Error(j?.error ?? "Unable to start TikTok OAuth flow");
-      window.location.href = j.url;
- } catch (e) {
-      toast.error(e instanceof Error ? e.message : "TikTok connection failed");
-      setState("idle");
- }
- }, []);
-
- const labelFor = (a: ConnectedTikTokAccount) =>
- a.username ??
- a.displayName ??
- (a.unionId ? `ID ${a.unionId.slice(0, 8)}` : null) ??
- `ID ${a.openId.slice(0, 8)}`;
-
- const initialsFor = (a: ConnectedTikTokAccount) => {
- const label = labelFor(a).trim();
- const letters = label.replace(/[^A-Za-z0-9]/g, "");
- if (letters.length === 0) return "TT";
- return letters.slice(0, 2).toUpperCase();
- };
-
- return (
- <div className="px-1 sm:px-2 lg:px-0">
-      {/* Header row (match Profile & Billing composition) */}
-      <div className="mb-4 flex items-center justify-between gap-3">
-        <Badge className="border-[#304674]/20 bg-[#304674]/10 px-3 py-1 text-[#304674] cursor-default transition-none">
-          <span className="inline-flex items-center gap-2">
-            <IonIcon name="logo-tiktok" />
-            TikTok connected: {sorted.length}
-          </span>
-        </Badge>
-        <div className="w-full max-w-xs md:w-auto">
-          <Button
-            className="w-full rounded-xl bg-[#304674] text-white"
-            variant={state === "loading" ? "loading" : "default"}
-            onClick={connect}
-            disabled={state === "loading"}
-          >
-            {state === "loading" ? "Connecting..." : "Connect TikTok"}
-          </Button>
-        </div>
-      </div>
-
-      {/* Body (no extra borders like an inner card header) */}
-      {loading ? (
-        <div className="flex items-center justify-center py-6">
-          <Spinner className="h-8 w-8" />
-        </div>
-      ) : sorted.length === 0 ? (
-        <div className="rounded-xl border px-4 py-3 text-sm text-muted-foreground">
-          No TikTok accounts connected yet.
-        </div>
-      ) : (
-        <div className="flex flex-wrap gap-2">
-          {sorted.map((a) => (
-            <Badge
-              key={a.openId}
-              variant="secondary"
-              className="flex items-center gap-2 pr-3 cursor-default transition-none"
-            >
-              <Avatar className="h-6 w-6">
-                <AvatarImage alt={labelFor(a)} src={a.avatarUrl ?? undefined} />
-                <AvatarFallback className="text-[10px]">
-                  {initialsFor(a)}
-                </AvatarFallback>
-              </Avatar>
-              <span className="text-xs font-medium">{labelFor(a)}</span>
-            </Badge>
-          ))}
-        </div>
-      )}
- </div>
- );
  +}
  \*\*\* End Patch
