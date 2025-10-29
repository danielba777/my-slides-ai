Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

*** Begin Patch
*** Update File: src/app/dashboard/connections/page.tsx
@@
-import PageHeader from "@/components/dashboard/PageHeader";
-import { ConnectionCard } from "@/components/connections/connection-card";
+import PageHeader from "@/components/dashboard/PageHeader";
+import { ConnectionCard } from "@/components/connections/connection-card";
 
 export default function ConnectionsPage() {
   return (
     <>
-      <PageHeader
-        title="Connections"
-        description="Link external services to streamline your workflow."
-      />
+      {/* Nur eine Headline, KEINE Beschreibung darunter */}
+      <PageHeader title="Connections" />
       <ConnectionCard />
     </>
   );
 }
*** End Patch
diff
Code kopieren
*** Begin Patch
*** Update File: src/components/connections/connection-card.tsx
@@
-"use client";
-
-import { useCallback, useEffect, useMemo, useState } from "react";
-
-import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
-import { Badge } from "@/components/ui/badge";
-import { Button } from "@/components/ui/button";
-import { Spinner } from "@/components/ui/spinner";
-import {
-  ConnectedTikTokAccount,
-  useTikTokAccounts,
-} from "@/hooks/use-tiktok-accounts";
-import IonIcon from "@reacticons/ionicons";
-import { defineCustomElements } from "ionicons/loader";
-import { toast } from "sonner";
-
-type ConnectionState = "idle" | "loading";
-
-export function ConnectionCard() {
-  const [connectionState, setConnectionState] =
-    useState<ConnectionState>("idle");
-  const {
-    accounts,
-    loading: accountsLoading,
-    error,
-    refresh,
-  } = useTikTokAccounts();
-
-  useEffect(() => {
-    if (typeof window !== "undefined") {
-      defineCustomElements(window);
-    }
-  }, []);
-
-  useEffect(() => {
-    if (error) {
-      toast.error(error);
-    }
-  }, [error]);
-
-  const sortedAccounts = useMemo(
-    () =>
-      [...accounts].sort(
-        (a, b) =>
-          new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime(),
-      ),
-    [accounts],
-  );
-
-  const handleConnect = useCallback(async () => {
-    setConnectionState("loading");
-
-    try {
-      const startResponse = await fetch("/api/tiktok/start");
-      const startPayload = await startResponse.json().catch(() => null);
-
-      if (
-        !startResponse.ok ||
-        !startPayload ||
-        typeof startPayload.url !== "string"
-      ) {
-        throw new Error(
-          startPayload && typeof startPayload.error === "string"
-            ? startPayload.error
-            : "Unable to start TikTok OAuth flow",
-        );
-      }
-
-      window.location.href = startPayload.url;
-    } catch (error) {
-      const message =
-        error instanceof Error ? error.message : "TikTok connection failed";
-      toast.error(message);
-      setConnectionState("idle");
-    }
-  }, []);
-
-  const renderAccountLabel = useCallback((account: ConnectedTikTokAccount) => {
-    return (
-      account.username ??
-      account.displayName ??
-      (account.unionId ? `ID ${account.unionId.slice(0, 8)}` : null) ??
-      `ID ${account.openId.slice(0, 8)}`
-    );
-  }, []);
-
-  const renderAccountInitials = useCallback(
-    (account: ConnectedTikTokAccount) => {
-      const label = renderAccountLabel(account).trim();
-      const letters = label.replace(/[^A-Za-z0-9]/g, "");
-      if (letters.length === 0) {
-        return "TT";
-      }
-      return letters.slice(0, 2).toUpperCase();
-    },
-    [renderAccountLabel],
-  );
-
-  return (
-    <div className="max-w-xl">
-      <div className="flex items-center gap-4">
-        <IonIcon name="logo-tiktok" size="large" />
-        <Button
-          variant={connectionState === "loading" ? "loading" : "default"}
-          onClick={handleConnect}
-          disabled={connectionState === "loading"}
-        >
-          {connectionState === "loading" ? "Connecting..." : "Connect TikTok"}
-        </Button>
-        {accountsLoading ? (
-          <div className="flex items-center justify-center py-4">
-            <Spinner className="h-8 w-8" />
-          </div>
-        ) : (
-          <div className="flex flex-wrap gap-2">
-            {sortedAccounts.map((account) => (
-              <Badge
-                key={account.openId}
-                variant="secondary"
-                className="flex items-center gap-2 pr-3"
-              >
-                <Avatar className="h-6 w-6">
-                  <AvatarImage
-                    alt={renderAccountLabel(account)}
-                    src={account.avatarUrl ?? undefined}
-                  />
-                  <AvatarFallback className="text-[10px]">
-                    {renderAccountInitials(account)}
-                  </AvatarFallback>
-                </Avatar>
-                <span className="text-xs font-medium">
-                  {renderAccountLabel(account)}
-                </span>
-              </Badge>
-            ))}
-          </div>
-        )}
-      </div>
-
-      <div className="py-4 border-t-2 mt-4">
-        <Button
-          variant="outline"
-          className=""
-          onClick={() => void refresh()}
-          disabled={accountsLoading}
-        >
-          Refresh
-        </Button>
-      </div>
-    </div>
-  );
-}
+"use client";
+
+import { useCallback, useEffect, useMemo, useState } from "react";
+
+import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
+import { Badge } from "@/components/ui/badge";
+import { Button } from "@/components/ui/button";
+import { Spinner } from "@/components/ui/spinner";
+import {
+  ConnectedTikTokAccount,
+  useTikTokAccounts,
+} from "@/hooks/use-tiktok-accounts";
+import IonIcon from "@reacticons/ionicons";
+import { defineCustomElements } from "ionicons/loader";
+import { toast } from "sonner";
+
+type ConnectionState = "idle" | "loading";
+
+export function ConnectionCard() {
+  const [connectionState, setConnectionState] =
+    useState<ConnectionState>("idle");
+  const { accounts, loading: accountsLoading, error } = useTikTokAccounts();
+
+  useEffect(() => {
+    if (typeof window !== "undefined") defineCustomElements(window);
+  }, []);
+
+  useEffect(() => {
+    if (error) toast.error(error);
+  }, [error]);
+
+  const sortedAccounts = useMemo(
+    () =>
+      [...accounts].sort(
+        (a, b) =>
+          new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime(),
+      ),
+    [accounts],
+  );
+
+  const handleConnect = useCallback(async () => {
+    setConnectionState("loading");
+    try {
+      const r = await fetch("/api/tiktok/start");
+      const j = await r.json().catch(() => null);
+      if (!r.ok || !j?.url) throw new Error(j?.error ?? "Unable to start TikTok OAuth flow");
+      window.location.href = j.url;
+    } catch (e) {
+      toast.error(e instanceof Error ? e.message : "TikTok connection failed");
+      setConnectionState("idle");
+    }
+  }, []);
+
+  const renderAccountLabel = useCallback((account: ConnectedTikTokAccount) => {
+    return (
+      account.username ??
+      account.displayName ??
+      (account.unionId ? `ID ${account.unionId.slice(0, 8)}` : null) ??
+      `ID ${account.openId.slice(0, 8)}`
+    );
+  }, []);
+
+  const renderAccountInitials = useCallback(
+    (account: ConnectedTikTokAccount) => {
+      const label = renderAccountLabel(account).trim();
+      const letters = label.replace(/[^A-Za-z0-9]/g, "");
+      if (letters.length === 0) return "TT";
+      return letters.slice(0, 2).toUpperCase();
+    },
+    [renderAccountLabel],
+  );
+
+  return (
+    <div className="px-1 sm:px-2 lg:px-0">
+      {/* Eine einzelne Card – keine zusätzlichen Headline-Doppler, kein blauer/weißer Balken */}
+      <div className="rounded-xl border p-4 shadow-none">
+        {/* Top-Zeile im Personal-Stil */}
+        <div className="mb-4 flex items-center justify-between gap-3">
+          <Badge className="border-[#304674]/20 bg-[#304674]/10 px-3 py-1 text-[#304674] cursor-default transition-none">
+            <span className="inline-flex items-center gap-2">
+              <IonIcon name="logo-tiktok" />
+              TikTok connected: {sortedAccounts.length}
+            </span>
+          </Badge>
+          <div className="w-full max-w-xs md:w-auto">
+            <Button
+              className="w-full rounded-xl bg-[#304674] text-white"
+              variant={connectionState === "loading" ? "loading" : "default"}
+              onClick={handleConnect}
+              disabled={connectionState === "loading"}
+            >
+              {connectionState === "loading" ? "Connecting..." : "Connect TikTok"}
+            </Button>
+          </div>
+        </div>
+
+        {/* Accounts */}
+        {accountsLoading ? (
+          <div className="flex items-center justify-center py-6">
+            <Spinner className="h-8 w-8" />
+          </div>
+        ) : sortedAccounts.length === 0 ? (
+          <div className="rounded-xl border px-4 py-3 text-sm text-muted-foreground">
+            No TikTok accounts connected yet.
+          </div>
+        ) : (
+          <div className="flex flex-wrap gap-2">
+            {sortedAccounts.map((account) => (
+              <Badge
+                key={account.openId}
+                variant="secondary"
+                className="flex items-center gap-2 pr-3 cursor-default transition-none"
+              >
+                <Avatar className="h-6 w-6">
+                  <AvatarImage
+                    alt={renderAccountLabel(account)}
+                    src={account.avatarUrl ?? undefined}
+                  />
+                  <AvatarFallback className="text-[10px]">
+                    {renderAccountInitials(account)}
+                  </AvatarFallback>
+                </Avatar>
+                <span className="text-xs font-medium">
+                  {renderAccountLabel(account)}
+                </span>
+              </Badge>
+            ))}
+          </div>
+        )}
+      </div>
+    </div>
+  );
+}
*** End Patch
diff
Code kopieren
*** Begin Patch
*** Update File: src/components/dashboard/settings/SettingsNav.tsx
@@
-const NAV_ITEMS = [
-  { label: "Personal",    href: "/dashboard/account/personal", icon: "user" },
-  { label: "Connections", href: "/dashboard/connections",      icon: "link" },
-  { label: "Billing",     href: "/dashboard/account/billing",  icon: "credit-card" },
-] as const;
+const NAV_ITEMS = [
+  { label: "Personal",    href: "/dashboard/account/personal", icon: "user" },
+  { label: "Billing",     href: "/dashboard/account/billing",  icon: "credit-card" },
+] as const;
*** End Patch