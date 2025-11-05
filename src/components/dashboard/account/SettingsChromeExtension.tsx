"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, RefreshCw } from "lucide-react";

type TokenResponse = {
  token: string;
};

export default function SettingsChromeExtension() {
  const qc = useQueryClient();

  const tokenQuery = useQuery<TokenResponse>({
    queryKey: ["extension-token"],
    queryFn: async () => {
      const res = await fetch("/api/account/extension-token", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load extension token");
      }

      return res.json();
    },
  });

  const rotate = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/account/extension-token", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to create new token");
      }

      return res.json() as Promise<TokenResponse>;
    },
    onSuccess: (data) => {
      qc.setQueryData<TokenResponse>(["extension-token"], data);
      toast.success("Extension token regenerated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not rotate token",
      );
    },
  });

  const handleCopy = useCallback(async () => {
    if (!tokenQuery.data?.token) return;

    try {
      await navigator.clipboard.writeText(tokenQuery.data.token);
      toast.success("Token copied to clipboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Copy failed. Try again.",
      );
    }
  }, [tokenQuery.data?.token]);

  const token = tokenQuery.data?.token ?? "";

  return (
    <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <CardHeader className="gap-2 md:flex md:items-center md:justify-between">
        <div>
          <CardTitle className="text-xl md:text-2xl">
            Chrome Extension Token
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use this token to connect the SlidesCockpit Chrome Extension with
            your personal library.
          </p>
        </div>
        <Badge className="border-[#304674]/20 bg-[#304674]/10 px-3 py-1 text-[#304674] cursor-default transition-none">
          Secure · Private
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6 p-6 md:p-8">
        {tokenQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : tokenQuery.isError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Could not load your extension token. Please refresh the page.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                Your personal token
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={token}
                  readOnly
                  className="font-mono text-sm tracking-wide"
                />
                <div className="flex gap-2 sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={handleCopy}
                    disabled={!token}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => rotate.mutate()}
                    disabled={rotate.isPending}
                  >
                    {rotate.isPending ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                How to use this token
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Install the SlidesCockpit Chrome Extension.</li>
                <li>Open the extension settings and paste this token.</li>
                <li>
                  Keep the token private. Use “Regenerate” to revoke old
                  extensions.
                </li>
              </ol>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
