Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

1) Prisma: Default von plan entfernen (Free = null)

codebase

diff --git a/prisma/schema.prisma b/prisma/schema.prisma
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -51,7 +51,7 @@
   // Billing
   stripeCustomerId String?
-  plan             Plan?        @default(STARTER)
+  plan             Plan?
   planSince        DateTime?
   planRenewsAt     DateTime?
   subscriptions    Subscription[]
   creditBalance    CreditBalance?


Danach ausführen:

pnpm prisma generate
pnpm prisma migrate dev -n drop-plan-default

2) Usage-API: Kein Rückfall auf „STARTER“, Flags mitgeben

Aktuelle Datei gibt "STARTER" zurück. Passe sie so an, dass null → „Free“ ist und das Frontend weiß, ob ein Customer / Abo existiert.


codebase

diff --git a/src/app/api/billing/usage/route.ts b/src/app/api/billing/usage/route.ts
--- a/src/app/api/billing/usage/route.ts
+++ b/src/app/api/billing/usage/route.ts
@@ -1,31 +1,39 @@
 import { NextResponse } from "next/server";
 import { auth } from "@/server/auth";
 import { db } from "@/server/db";
 
 export async function GET() {
   const session = await auth();
   if (!session?.user?.id) {
     return new NextResponse("Unauthorized", { status: 401 });
   }
   const user = await db.user.findUnique({
     where: { id: session.user.id },
     select: {
-      plan: true,
-      planRenewsAt: true,
+      plan: true, // kann null sein = Free
+      planRenewsAt: true,
+      stripeCustomerId: true,
       creditBalance: { select: { credits: true, aiCredits: true, resetsAt: true } },
       subscriptions: {
         select: { status: true, currentPeriodEnd: true, stripeSubscriptionId: true, stripePriceId: true },
         orderBy: { updatedAt: "desc" },
         take: 1,
       },
     },
   });
-  return NextResponse.json({
-    plan: user?.plan ?? "STARTER",
-    status: user?.subscriptions?.[0]?.status ?? "ACTIVE",
-    credits: user?.creditBalance?.credits ?? 0,
-    aiCredits: user?.creditBalance?.aiCredits ?? 0,
-    resetsAt: user?.creditBalance?.resetsAt ?? user?.planRenewsAt ?? null,
-    stripePriceId: user?.subscriptions?.[0]?.stripePriceId ?? null,
-    stripeSubscriptionId: user?.subscriptions?.[0]?.stripeSubscriptionId ?? null,
-  });
+  const latestSub = user?.subscriptions?.[0] ?? null;
+  const hasPlan = !!user?.plan;
+  return NextResponse.json({
+    plan: hasPlan ? user!.plan : null,
+    status: latestSub?.status ?? null,
+    credits: hasPlan ? user?.creditBalance?.credits ?? 0 : null,
+    aiCredits: hasPlan ? user?.creditBalance?.aiCredits ?? 0 : null,
+    resetsAt: hasPlan ? (user?.creditBalance?.resetsAt ?? user?.planRenewsAt ?? null) : null,
+    stripePriceId: latestSub?.stripePriceId ?? null,
+    stripeSubscriptionId: latestSub?.stripeSubscriptionId ?? null,
+    hasCustomer: !!user?.stripeCustomerId,
+    hasSubscription: !!latestSub?.stripeSubscriptionId,
+  });
 }

3) Webhook: Kündigung auf „Free“ (null), nicht „STARTER“

In deiner Datei fällt customer.subscription.deleted aktuell auf „STARTER“ zurück.


codebase

diff --git a/src/app/api/stripe/webhook/route.ts b/src/app/api/stripe/webhook/route.ts
--- a/src/app/api/stripe/webhook/route.ts
+++ b/src/app/api/stripe/webhook/route.ts
@@ -120,11 +120,12 @@
       case "customer.subscription.deleted": {
         const sub = evt.data.object as any;
         const user = await db.user.findFirst({
           where: { subscriptions: { some: { stripeSubscriptionId: sub.id } } },
         });
         if (!user) break;
         await db.subscription.update({
           where: { stripeSubscriptionId: sub.id },
           data: { status: "CANCELED" },
         });
-        await db.user.update({ where: { id: user.id }, data: { plan: "STARTER" } });
+        // kein bezahlter Plan mehr → Free
+        await db.user.update({ where: { id: user.id }, data: { plan: null, planRenewsAt: null } });
         break;
       }


(Falls du hier weitere Upgrades/Top-ups implementiert hast, lass die unverändert – nur den „deleted“-Zweig wie oben anpassen.)

4) Dashboard-UI: „Free“ anzeigen & freie Planwahl

Zeig „Free / No plan yet“ und einen Button /pricing (nicht fest auf 19€-Plan). Portal-Button nur, wenn eine Sub existiert.
Diese Diff passt zu deiner aktuellen ProfileBilling.tsx.


codebase

 

codebase

diff --git a/src/components/dashboard/billing/ProfileBilling.tsx b/src/components/dashboard/billing/ProfileBilling.tsx
--- a/src/components/dashboard/billing/ProfileBilling.tsx
+++ b/src/components/dashboard/billing/ProfileBilling.tsx
@@ -1,13 +1,13 @@
 "use client";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Progress } from "@/components/ui/progress";
 import { PLAN_CREDITS } from "@/lib/billing";
 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
-import { useSession } from "next-auth/react";
+import { useRouter } from "next/navigation";
 import { useEffect } from "react";
 import { toast } from "sonner";
 
 type Usage = {
-  plan: string;
-  status: "ACTIVE" | "PAST_DUE" | "TRIALING" | "CANCELED" | string;
-  credits: number;
-  aiCredits: number;
+  plan: string | null;
+  status: "ACTIVE" | "PAST_DUE" | "TRIALING" | "CANCELED" | string | null;
+  credits: number | null;
+  aiCredits: number | null;
   resetsAt: string | null;
   stripePriceId: string | null;
   stripeSubscriptionId: string | null;
+  hasCustomer: boolean;
+  hasSubscription: boolean;
 };
 
 export default function ProfileBilling() {
-  const { data: session } = useSession();
+  const router = useRouter();
   const qc = useQueryClient();
@@ -51,31 +51,49 @@
 
   const data = usage.data;
-  const pack = PLAN_CREDITS[data.plan as keyof typeof PLAN_CREDITS] ?? {
-    credits: 0,
-    ai: 0,
-  };
-  const total = pack.credits < 0 ? Infinity : pack.credits;
-  const aiTotal = pack.ai < 0 ? Infinity : pack.ai;
-  const used = total === Infinity ? 0 : Math.max(0, total - data.credits);
-  const aiUsed =
-    aiTotal === Infinity ? 0 : Math.max(0, aiTotal - data.aiCredits);
-  const pct = total === Infinity ? 0 : Math.round((used / total) * 100);
-  const aiPct = aiTotal === Infinity ? 0 : Math.round((aiUsed / aiTotal) * 100);
+  const hasPlan = !!data.plan;
+  const pack = hasPlan ? (PLAN_CREDITS[data.plan as keyof typeof PLAN_CREDITS] ?? { credits: 0, ai: 0 }) : null;
+  const total   = pack ? (pack.credits < 0 ? Infinity : pack.credits) : 0;
+  const aiTotal = pack ? (pack.ai      < 0 ? Infinity : pack.ai)      : 0;
+  const creditsLeft = hasPlan && Number.isFinite(total) ? (data.credits ?? 0) : null;
+  const aiLeft      = hasPlan && Number.isFinite(aiTotal) ? (data.aiCredits ?? 0) : null;
+  const used  = pack && Number.isFinite(total)   ? Math.max(0, total   - (data.credits ?? 0))     : 0;
+  const aiUsed= pack && Number.isFinite(aiTotal) ? Math.max(0, aiTotal - (data.aiCredits ?? 0))   : 0;
+  const pct   = total   === Infinity ? 0 : Math.round((used   / (total   || 1)) * 100);
+  const aiPct = aiTotal === Infinity ? 0 : Math.round((aiUsed / (aiTotal || 1)) * 100);
 
   return (
     <div className="px-4 sm:px-6 lg:px-8 py-8">
       <div className="max-w-6xl mx-auto grid grid-cols-1 gap-6 lg:grid-cols-3">
         {/* Plan Card */}
         <Card className="lg:col-span-1 backdrop-blur supports-[backdrop-filter]:bg-background/70">
           <CardHeader className="space-y-1">
-            <CardTitle className="text-xl">Your plan</CardTitle>
-            <div className="flex items-center gap-2">
-              <Badge variant="secondary">{data.plan}</Badge>
-              <Badge variant={data.status === "ACTIVE" ? "default" : "secondary"}>{data.status}</Badge>
-            </div>
+            <CardTitle className="text-xl">Your plan</CardTitle>
+            {hasPlan ? (
+              <div className="flex items-center gap-2">
+                <Badge variant="secondary">{data.plan}</Badge>
+                {data.status && <Badge variant={data.status === "ACTIVE" ? "default" : "secondary"}>{data.status}</Badge>}
+              </div>
+            ) : (
+              <div className="flex items-center gap-2">
+                <Badge variant="secondary">Free</Badge>
+                <span className="text-sm text-muted-foreground">(no plan yet)</span>
+              </div>
+            )}
           </CardHeader>
           <CardContent className="space-y-4">
-            <Button variant="secondary" className="w-full">Manage subscription</Button>
+            {data.hasSubscription ? (
+              <Button variant="secondary" onClick={() => fetch("/api/billing/portal", { method: "POST" }).then(r => r.json()).then(({url}) => (window.location.href=url))} className="w-full">
+                Manage subscription
+              </Button>
+            ) : (
+              <Button className="w-full" onClick={() => router.push("/pricing")}>
+                Choose a plan
+              </Button>
+            )}
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
-              <Progress value={pct} className="mb-2" />
-              <div className="text-sm">{pack.credits < 0 ? "Unlimited" : `${data.credits} left of ${pack.credits}`}</div>
+              {hasPlan && pack ? <>
+                <Progress value={pct} className="mb-2" />
+                <div className="text-sm">{pack.credits < 0 ? "Unlimited" : `${creditsLeft ?? 0} left of ${pack.credits}`}</div>
+              </> : <div className="text-sm text-muted-foreground">—</div>}
             </div>
             <div>
               <div className="text-sm font-medium mb-2">AI credits</div>
-              <Progress value={aiPct} className="mb-2" />
-              <div className="text-sm">{pack.ai < 0 ? "Unlimited" : `${data.aiCredits} left of ${pack.ai}`}</div>
+              {hasPlan && pack ? <>
+                <Progress value={aiPct} className="mb-2" />
+                <div className="text-sm">{pack.ai < 0 ? "Unlimited" : `${aiLeft ?? 0} left of ${pack.ai}`}</div>
+              </> : <div className="text-sm text-muted-foreground">—</div>}
             </div>
           </CardContent>
         </Card>