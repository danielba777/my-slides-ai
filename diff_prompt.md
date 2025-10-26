Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:
✅ Claude-CLI Diff (nur das Nötigste)
**_ Begin Patch
_** Update File: src/components/dashboard/billing/ProfileBilling.tsx
@@
-"use client";
-import { useEffect } from "react";
-import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
-import { Button } from "@/components/ui/button";
-import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
-import { Progress } from "@/components/ui/progress";
-import { Badge } from "@/components/ui/badge";
-import { toast } from "sonner";
-import { PLAN_CREDITS } from "@/lib/billing";

- "use client";
- import { useEffect } from "react";
- import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
- import { useSession } from "next-auth/react";
- import { Button } from "@/components/ui/button";
- import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
- import { Progress } from "@/components/ui/progress";
- import { Badge } from "@/components/ui/badge";
- import { toast } from "sonner";
- import { PLAN_CREDITS } from "@/lib/billing";
  @@

* type Usage = {

- type Usage = {
  plan: string;
  status: "ACTIVE" | "PAST_DUE" | "TRIALING" | "CANCELED" | string;
  credits: number;
  aiCredits: number;
  resetsAt: string | null;
- /\*_ fallback if resetsAt not yet persisted (e.g., test/dev or first cycle) _/
- planRenewsAt?: string | null;
  stripePriceId: string | null;
  stripeSubscriptionId: string | null;
  };

export default function ProfileBilling() {

- const { data: session } = useSession();
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
  @@
  const data = usage.data;
  const pack = PLAN_CREDITS[data.plan as keyof typeof PLAN_CREDITS] ?? { credits: 0, ai: 0 };
  const total = pack.credits < 0 ? Infinity : pack.credits;
  const aiTotal = pack.ai < 0 ? Infinity : pack.ai;
  const used = total === Infinity ? 0 : Math.max(0, total - data.credits);
  const aiUsed = aiTotal === Infinity ? 0 : Math.max(0, aiTotal - data.aiCredits);
  const pct = total === Infinity ? 0 : Math.round((used / total) \* 100);

* const aiPct = aiTotal === Infinity ? 0 : Math.round((aiUsed / aiTotal) \* 100);
* const nextReset = data.resetsAt ? new Date(data.resetsAt) : null;

- const aiPct = aiTotal === Infinity ? 0 : Math.round((aiUsed / aiTotal) \* 100);
- const resetISO = data.resetsAt ?? data.planRenewsAt ?? null;
- const nextReset = resetISO ? new Date(resetISO) : null;
  @@

* return (
*     <div className="px-4 sm:px-6 lg:px-8 py-8">
*       <div className="max-w-6xl mx-auto grid grid-cols-1 gap-6 lg:grid-cols-3">
*         {/* Plan Card */}
*         <Card className="lg:col-span-1 backdrop-blur supports-[backdrop-filter]:bg-background/70">
*           <CardHeader className="space-y-1">
*             <CardTitle className="text-xl">Your plan</CardTitle>
*             <div className="flex items-center gap-2">
*               <Badge variant="secondary">{data.plan}</Badge>
*               <Badge variant={data.status === "ACTIVE" ? "default" : "outline"}>
*                 {data.status}
*               </Badge>
*             </div>
*           </CardHeader>
*           <CardContent className="space-y-4">
*             <div className="text-sm text-muted-foreground">
*               Next reset: {nextReset ? nextReset.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"}
*             </div>
*             <div className="space-y-2">
*               <div className="text-sm font-medium">Monthly credits</div>
*               <Progress value={pct} />
*               <div className="text-xs text-muted-foreground">
*                 {pack.credits < 0 ? "Unlimited" : `${data.credits} of ${pack.credits} left`}
*               </div>
*             </div>
*             <div className="space-y-2">
*               <div className="text-sm font-medium">AI credits</div>
*               <Progress value={aiPct} />
*               <div className="text-xs text-muted-foreground">
*                 {pack.ai < 0 ? "Unlimited" : `${data.aiCredits} of ${pack.ai} left`}
*               </div>
*             </div>
*             <div className="pt-4">
*               {/* Single action button — portal contains all billing actions (change plan, payment methods, invoices) */}
*               <Button
*                 variant="secondary"
*                 onClick={() => toPortal.mutate()}
*                 disabled={toPortal.isPending}
*                 className="w-full"
*               >
*                 Manage subscription
*               </Button>
*             </div>
*           </CardContent>
*         </Card>
*
*         {/* Minimal right column: keep it clean and compact */}
*         <Card className="lg:col-span-2 backdrop-blur supports-[backdrop-filter]:bg-background/70">
*           <CardHeader>
*             <CardTitle className="text-xl">Usage</CardTitle>
*           </CardHeader>
*           <CardContent className="space-y-6">
*             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
*               <div>
*                 <div className="text-sm font-medium mb-2">Monthly credits</div>
*                 <div className="text-sm">{pack.credits < 0 ? "Unlimited" : `${data.credits} left of ${pack.credits}`}</div>
*               </div>
*               <div>
*                 <div className="text-sm font-medium mb-2">AI credits</div>
*                 <div className="text-sm">{pack.ai < 0 ? "Unlimited" : `${data.aiCredits} left of ${pack.ai}`}</div>
*               </div>
*             </div>
*             <div className="text-xs text-muted-foreground">
*               All billing actions (change plan, payment methods, invoice history) are managed in Stripe's portal.
*             </div>
*           </CardContent>
*         </Card>
*       </div>
*     </div>
* );

- return (
-     <div className="px-4 sm:px-6 lg:px-8 py-8">
-       <div className="mx-auto w-full max-w-5xl space-y-6">
-         {/* TOP: Account + Plan + Manage */}
-         <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/70">
-           <CardHeader className="space-y-2">
-             <div className="flex flex-wrap items-center justify-between gap-3">
-               <CardTitle className="text-xl">Profile & Billing</CardTitle>
-               <div className="flex items-center gap-2">
-                 <Badge variant="secondary">{data.plan}</Badge>
-                 <Badge variant={data.status === "ACTIVE" ? "default" : "outline"}>
-                   {data.status}
-                 </Badge>
-               </div>
-             </div>
-             <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-2">
-               <div>
-                 Email: <span className="text-foreground">{session?.user?.email ?? "—"}</span>
-               </div>
-               <div>
-                 Next reset:{" "}
-                 <span className="text-foreground">
-                   {nextReset
-                     ? nextReset.toLocaleDateString(undefined, {
-                         year: "numeric",
-                         month: "short",
-                         day: "numeric",
-                       })
-                     : "—"}
-                 </span>
-               </div>
-             </div>
-           </CardHeader>
-           <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
-             <div className="text-sm text-muted-foreground">
-               Manage plan, payment methods and invoices in Stripe.
-             </div>
-             <Button onClick={() => toPortal.mutate()} disabled={toPortal.isPending}>
-               Manage subscription
-             </Button>
-           </CardContent>
-         </Card>
-
-         {/* BOTTOM: Usage (two bars side by side) */}
-         <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/70">
-           <CardHeader>
-             <CardTitle className="text-base">Usage</CardTitle>
-           </CardHeader>
-           <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
-             <div className="space-y-2">
-               <div className="flex items-center justify-between text-sm">
-                 <span>Monthly credits</span>
-                 <span className="text-muted-foreground">
-                   {pack.credits < 0 ? "Unlimited" : `${data.credits}/${pack.credits}`}
-                 </span>
-               </div>
-               <Progress value={pct} />
-             </div>
-             <div className="space-y-2">
-               <div className="flex items-center justify-between text-sm">
-                 <span>AI credits</span>
-                 <span className="text-muted-foreground">
-                   {pack.ai < 0 ? "Unlimited" : `${data.aiCredits}/${pack.ai}`}
-                 </span>
-               </div>
-               <Progress value={aiPct} />
-             </div>
-           </CardContent>
-         </Card>
-       </div>
-     </div>
- );
  }
  \*\*\* End Patch
