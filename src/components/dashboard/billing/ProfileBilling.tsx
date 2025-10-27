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
  const pack = hasPlan ? (PLAN_CREDITS[data.plan as keyof typeof PLAN_CREDITS] ?? { credits: 0, ai: 0 }) : null;
  const total   = pack ? (pack.credits < 0 ? Infinity : pack.credits) : 0;
  const aiTotal = pack ? (pack.ai      < 0 ? Infinity : pack.ai)      : 0;
  const creditsLeft = data.credits ?? null;
  const aiLeft      = data.aiCredits ?? null;
  const used = !hasPlan || creditsLeft == null || total === 0 || total === Infinity ? 0 : Math.max(0, total - creditsLeft);
  const aiUsed = !hasPlan || aiLeft == null || aiTotal === 0 || aiTotal === Infinity ? 0 : Math.max(0, aiTotal - aiLeft);
  const pct = !hasPlan || total === 0 || total === Infinity ? 0 : Math.round((used / total) * 100);
  const aiPct = !hasPlan || aiTotal === 0 || aiTotal === Infinity ? 0 : Math.round((aiUsed / aiTotal) * 100);
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
                {data.status && <Badge variant={data.status === "ACTIVE" ? "default" : "secondary"}>{data.status}</Badge>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Free</Badge>
                <Badge variant="outline">No subscription</Badge>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {hasPlan ? (
              data.hasSubscription ? (
                <Button onClick={async () => {
                  const r = await fetch("/api/billing/portal", { method: "POST" });
                  const j = await r.json();
                  if (j?.url) window.location.href = j.url;
                  else toast.error("Could not open portal");
                }}>
                  Manage subscription
                </Button>
              ) : (
                <Button onClick={() => router.push("/#pricing")}>Choose a plan</Button>
              )
            ) : (
              <Button onClick={() => router.push("/#pricing")}>Choose a plan</Button>
            )}
          </CardContent>
        </Card>

        {/* Usage Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasPlan ? (
              <>
                {/* Credits */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Credits</span>
                    <span className="text-xs text-muted-foreground">
                      {pack!.credits < 0 ? "∞" : `${used}/${total}`}
                    </span>
                  </div>
                  <Progress value={pack!.credits < 0 ? 0 : pct} />
                </div>
                {/* AI Credits */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">AI credits</span>
                    <span className="text-xs text-muted-foreground">
                      {pack!.ai < 0 ? "∞" : `${aiUsed}/${aiTotal}`}
                    </span>
                  </div>
                  <Progress value={pack!.ai < 0 ? 0 : aiPct} />
                </div>
                {nextReset && (
                  <div className="text-xs text-muted-foreground">
                    Resets on {nextReset.toLocaleDateString()}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No plan yet — <button className="underline" onClick={() => router.push("/#pricing")}>choose a plan</button> to unlock credits.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
