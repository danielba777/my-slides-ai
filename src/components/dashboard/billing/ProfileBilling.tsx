"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PLAN_CREDITS } from "@/lib/billing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

type Usage = {
  plan: string | null;
  status: "ACTIVE" | "PAST_DUE" | "TRIALING" | "CANCELED" | string | null;
  credits: number | null;
  aiCredits: number | null;
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
  const hasPlan = !!data.plan;
  const pack = hasPlan
    ? (PLAN_CREDITS[data.plan as keyof typeof PLAN_CREDITS] ?? {
        credits: 0,
        ai: 0,
      })
    : null;
  const total = pack ? (pack.credits < 0 ? Infinity : pack.credits) : 0;
  const aiTotal = pack ? (pack.ai < 0 ? Infinity : pack.ai) : 0;
  const creditsLeft =
    hasPlan && Number.isFinite(total) ? (data.credits ?? 0) : null;
  const aiLeft =
    hasPlan && Number.isFinite(aiTotal) ? (data.aiCredits ?? 0) : null;
  const used =
    pack && Number.isFinite(total)
      ? Math.max(0, total - (data.credits ?? 0))
      : 0;
  const aiUsed =
    pack && Number.isFinite(aiTotal)
      ? Math.max(0, aiTotal - (data.aiCredits ?? 0))
      : 0;
  const pct = total === Infinity ? 0 : Math.round((used / (total || 1)) * 100);
  const aiPct =
    aiTotal === Infinity ? 0 : Math.round((aiUsed / (aiTotal || 1)) * 100);
  const nextReset = data.resetsAt ? new Date(data.resetsAt) : null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Plan Card */}
        <Card className="lg:col-span-1 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Your plan</CardTitle>
            {hasPlan ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{data.plan}</Badge>
                <Badge
                  variant={data.status === "ACTIVE" ? "default" : "outline"}
                >
                  {data.status}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Free</Badge>
                <span className="text-sm text-muted-foreground">
                  (no plan yet)
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {hasPlan ? (
              <div className="text-sm text-muted-foreground">
                Next reset:{" "}
                {nextReset
                  ? nextReset.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Choose a plan to unlock limits.
              </div>
            )}
            <div className="space-y-2">
              <div className="text-sm font-medium">Monthly credits</div>
              {hasPlan ? (
                <>
                  <Progress value={pct} />
                  <div className="text-xs text-muted-foreground">
                    {pack!.credits < 0
                      ? "Unlimited"
                      : `${creditsLeft ?? 0} of ${pack!.credits} left`}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">—</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">AI credits</div>
              {hasPlan ? (
                <>
                  <Progress value={aiPct} />
                  <div className="text-xs text-muted-foreground">
                    {pack!.ai < 0
                      ? "Unlimited"
                      : `${aiLeft ?? 0} of ${pack!.ai} left`}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">—</div>
              )}
            </div>
            <div className="pt-4">
              {data.hasSubscription ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    fetch("/api/billing/portal", { method: "POST" })
                      .then((r) => r.json())
                      .then(({ url }) => (window.location.href = url))
                  }
                  className="w-full"
                >
                  Manage subscription
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => router.push("/#pricing")}
                >
                  Choose a plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium mb-2">Monthly credits</div>
              {hasPlan && pack ? (
                <>
                  <Progress value={pct} className="mb-2" />
                  <div className="text-sm">
                    {pack.credits < 0
                      ? "Unlimited"
                      : `${creditsLeft ?? 0} left of ${pack.credits}`}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">—</div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium mb-2">AI credits</div>
              {hasPlan && pack ? (
                <>
                  <Progress value={aiPct} className="mb-2" />
                  <div className="text-sm">
                    {pack.ai < 0
                      ? "Unlimited"
                      : `${aiLeft ?? 0} left of ${pack.ai}`}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">—</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
