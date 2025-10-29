"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PLAN_CREDITS } from "@/lib/billing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Infinity as InfinityIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

type Usage = {
  plan: string | null;
  status: "ACTIVE" | "PAST_DUE" | "TRIALING" | "CANCELED" | string | null;
  credits: number | null;
  aiCredits: number | null;
  usedCredits: number | null;
  usedAiCredits: number | null;
  resetsAt: string | null;
  stripePriceId: string | null;
  stripeSubscriptionId: string | null;
  hasCustomer: boolean;
  hasSubscription: boolean;
};

export default function ProfileBilling() {
  const router = useRouter();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const usage = useQuery<Usage>({
    queryKey: ["billing-usage"],
    queryFn: async () => {
      const res = await fetch("/api/billing/usage", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load billing usage");
      return res.json();
    },
    refetchInterval: 10_000,
  });

  const toPortal = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (!res.ok) throw new Error("Failed to open customer portal");
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (e: any) => toast.error(e?.message ?? "Portal error"),
  });

  useEffect(() => {
    // Light auto-refresh on window focus
    const onFocus = () => qc.invalidateQueries({ queryKey: ["billing-usage"] });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [qc]);

  if (usage.isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mx-auto max-w-5xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">
              Profile & Billing
            </CardTitle>
          </CardHeader>
          <CardContent>Loading…</CardContent>
        </Card>
      </div>
    );
  }
  if (usage.isError || !usage.data) {
    return (
      <div className="px-6 py-10 text-destructive">Failed to load billing.</div>
    );
  }

  const data = usage.data;

  const hasPlan = !!data.plan;
  const pack = hasPlan
    ? (PLAN_CREDITS[data.plan as keyof typeof PLAN_CREDITS] ?? {
        credits: 0,
        ai: 0,
      })
    : null;
  const total = pack ? (pack.credits < 0 ? Infinity : pack.credits) : 0;
  const aiTotal = pack ? (pack.ai < 0 ? Infinity : pack.ai) : 0;
  // Always show REMAINING like "950/1000"
  const creditsLeft =
    data.credits == null ? null : data.credits < 0 ? Infinity : data.credits;
  const aiLeft =
    data.aiCredits == null
      ? null
      : data.aiCredits < 0
        ? Infinity
        : data.aiCredits;
  const remaining =
    total === Infinity
      ? Infinity
      : (creditsLeft ?? Math.max(0, total - (data.usedCredits ?? 0)));
  const aiRemaining =
    aiTotal === Infinity
      ? Infinity
      : (aiLeft ?? Math.max(0, aiTotal - (data.usedAiCredits ?? 0)));
  const remainingPct =
    total && total !== Infinity
      ? Math.min(100, Math.round((remaining / total) * 100))
      : 100;
  const aiRemainingPct =
    aiTotal && aiTotal !== Infinity
      ? Math.min(100, Math.round((aiRemaining / aiTotal) * 100))
      : 100;
  // If ~full (>=95% and <100), show 98% filled as requested
  const displayPct =
    total === Infinity
      ? 100
      : remainingPct >= 95 && remainingPct < 100
        ? 98
        : remainingPct;
  const aiDisplayPct =
    aiTotal === Infinity
      ? 100
      : aiRemainingPct >= 95 && aiRemainingPct < 100
        ? 98
        : aiRemainingPct;
  const nextReset = data.resetsAt ? new Date(data.resetsAt) : null;
  // Plan change UI & handler removed on request

  return (
    <div className="px-1 sm:px-2 lg:px-0">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold md:text-2xl">
            Personal & Billing
          </h2>
          <div className="inline-flex items-center gap-2">
            {/* Clearer plan labeling; removes noisy "Current UNLIMITED" */}
            <Badge className="border-[#304674]/20 bg-[#304674]/10 px-3 py-1 text-[#304674] hover:bg-[#304674]/10 hover:text-[#304674] cursor-default transition-none">
              Plan: {hasPlan ? data.plan : "Free"}
            </Badge>
            {nextReset && (
              <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                Resets on {nextReset.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="w-full max-w-xs md:w-auto">
          {hasPlan && data.hasSubscription ? (
            <Button
              className="w-full rounded-xl bg-[#304674] text-white hover:opacity-90"
              onClick={async () => {
                const r = await fetch("/api/billing/portal", {
                  method: "POST",
                });
                const j = await r.json();
                if (j?.url) window.location.href = j.url;
                else toast.error("Could not open portal");
              }}
            >
              Manage subscription
            </Button>
          ) : (
            <Button
              className="w-full rounded-xl"
              onClick={() => router.push("/#pricing")}
            >
              Choose a plan
            </Button>
          )}
        </div>
      </div>

      {/* Credits (Remaining) */}
      <div className="mt-6 rounded-xl border p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Credits (remaining) */}
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Credits (remaining)
            </div>
            <div className="mt-1 text-lg font-semibold">
              {total === Infinity ? (
                <span className="inline-flex items-center gap-1 align-middle">
                  <InfinityIcon
                    strokeWidth={2.5}
                    className="h-4 w-4 -mt-px"
                    aria-label="Unlimited credits"
                  />
                </span>
              ) : (
                `${remaining}/${total}`
              )}
            </div>
            <Progress className="mt-2 h-1.5" value={displayPct} />
          </div>
          <div className="rounded-lg">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              AI Credits (remaining)
            </div>
            <div className="mt-1 text-lg font-semibold">
              {aiTotal === Infinity ? (
                <span className="inline-flex items-center gap-1 align-middle">
                  <InfinityIcon
                    strokeWidth={2.5}
                    className="h-4 w-4 -mt-px"
                    aria-label="Unlimited AI credits"
                  />
                </span>
              ) : (
                `${aiRemaining}/${aiTotal}`
              )}
            </div>
            <Progress className="mt-2 h-1.5" value={aiDisplayPct} />
          </div>
        </div>
        {nextReset && (
          <div className="mt-3 text-xs text-muted-foreground">
            Resets on {nextReset.toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Plan Selector removed on request */}
    </div>
  );
}
