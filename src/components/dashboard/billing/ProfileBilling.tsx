"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PLAN_CREDITS } from "@/lib/billing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { toast } from "sonner";

type Usage = {
  plan: string;
  status: "ACTIVE" | "PAST_DUE" | "TRIALING" | "CANCELED" | string;
  credits: number;
  aiCredits: number;
  resetsAt: string | null;
  /* fallback if resetsAt not yet persisted (e.g., test/dev or first cycle) */
  planRenewsAt?: string | null;
  stripePriceId: string | null;
  stripeSubscriptionId: string | null;
};

export default function ProfileBilling() {
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
      <div className="px-6 py-10">
        <Card className="max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle>Profile & Billing</CardTitle>
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
  const pack = PLAN_CREDITS[data.plan as keyof typeof PLAN_CREDITS] ?? {
    credits: 0,
    ai: 0,
  };
  const total = pack.credits < 0 ? Infinity : pack.credits;
  const aiTotal = pack.ai < 0 ? Infinity : pack.ai;
  const used = total === Infinity ? 0 : Math.max(0, total - data.credits);
  const aiUsed =
    aiTotal === Infinity ? 0 : Math.max(0, aiTotal - data.aiCredits);
  const pct = total === Infinity ? 0 : Math.round((used / total) * 100);
  const aiPct = aiTotal === Infinity ? 0 : Math.round((aiUsed / aiTotal) * 100);
  const resetISO = data.resetsAt ?? data.planRenewsAt ?? null;
const nextReset = resetISO ? new Date(resetISO) : null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* TOP: Account + Plan + Manage */}
        <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-xl">Profile & Billing</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{data.plan}</Badge>
                <Badge variant={data.status === "ACTIVE" ? "default" : "outline"}>
                  {data.status}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <div>
                Email: <span className="text-foreground">{session?.user?.email ?? "—"}</span>
              </div>
              <div>
                Next reset:{" "}
                <span className="text-foreground">
                  {nextReset
                    ? nextReset.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Manage plan, payment methods and invoices in Stripe.
            </div>
            <Button onClick={() => toPortal.mutate()} disabled={toPortal.isPending}>
              Manage subscription
            </Button>
          </CardContent>
        </Card>

        {/* BOTTOM: Usage (two bars side by side) */}
        <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <CardHeader>
            <CardTitle className="text-base">Usage</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Monthly credits</span>
                <span className="text-muted-foreground">
                  {pack.credits < 0 ? "Unlimited" : `${data.credits}/${pack.credits}`}
                </span>
              </div>
              <Progress value={pct} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>AI credits</span>
                <span className="text-muted-foreground">
                  {pack.ai < 0 ? "Unlimited" : `${data.aiCredits}/${pack.ai}`}
                </span>
              </div>
              <Progress value={aiPct} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
