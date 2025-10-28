Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

*** Begin Patch
*** Update File: src/server/billing.ts
@@
 import type { Plan } from "@prisma/client";
 import { PLAN_CREDITS, FREE_SLIDESHOW_QUOTA } from "@/lib/billing";
 
 export function planFromPrice(priceId?: string): Plan | undefined {
@@
   return undefined;
 }
 
+/**
+ * Hartes Zurücksetzen/Neuaufsetzen der CreditBalance anhand eines Ziel-Plans.
+ * - Downgrade: used=0, left = neues Kontingent
+ * - Upgrade:   used bleibt, left = neuesKontingent - used (>=0)
+ * - Wechsel Free <-> Paid wird ebenfalls korrekt abgebildet
+ * Es wird bewusst delete→create benutzt, damit keine Altwerte/Resets hängen bleiben.
+ */
+export async function carryOverCreditsOnPlanChange(
+  tx: typeof db,
+  userId: string,
+  oldPlan: Plan | null,
+  newPlan: Plan,
+  newPeriodEnd: Date | null,
+) {
+  const prev = await tx.creditBalance.findUnique({ where: { userId } });
+
+  // Altdaten sichern
+  const prevUsedSlides   = prev?.usedCredits    ?? 0;
+  const prevUsedAi       = prev?.usedAiCredits  ?? 0;
+  const prevLeftSlides   = prev?.credits        ?? 0;
+  const prevLeftAi       = prev?.aiCredits      ?? 0;
+
+  // Neues Kontingent ermitteln
+  const target = PLAN_CREDITS[newPlan];
+  const newTotalSlides = target.credits < 0 ? Number.POSITIVE_INFINITY : target.credits;
+  const newTotalAi     = target.ai      < 0 ? Number.POSITIVE_INFINITY : target.ai;
+
+  const wasUnlimited = oldPlan === "UNLIMITED";
+  const isUnlimited  = newPlan === "UNLIMITED";
+  const isDowngrade  =
+    !isUnlimited &&
+    (oldPlan && PLAN_CREDITS[oldPlan].credits > 0) &&
+    (PLAN_CREDITS[oldPlan].credits > PLAN_CREDITS[newPlan].credits);
+
+  // Bisher „used“ robuster bestimmen:
+  // a) Falls wir echte used*-Zähler haben, nimm diese
+  // b) Andernfalls aus Left ableiten (nur wenn alter Plan endlich war)
+  const inferredUsedSlides = Number.isFinite(newTotalSlides)
+    ? (prevUsedSlides || (oldPlan && oldPlan !== "UNLIMITED"
+        ? Math.max(0, (PLAN_CREDITS[oldPlan].credits) - prevLeftSlides)
+        : 0))
+    : 0;
+  const inferredUsedAi = Number.isFinite(newTotalAi)
+    ? (prevUsedAi || (oldPlan && oldPlan !== "UNLIMITED"
+        ? Math.max(0, (PLAN_CREDITS[oldPlan].ai) - prevLeftAi)
+        : 0))
+    : 0;
+
+  let nextLeftSlides: number;
+  let nextUsedSlides: number;
+  let nextLeftAi: number;
+  let nextUsedAi: number;
+
+  if (isUnlimited) {
+    // Unlimited → kein Verbrauch, alles egal
+    nextLeftSlides = Number.POSITIVE_INFINITY;
+    nextUsedSlides = 0;
+    nextLeftAi     = Number.POSITIVE_INFINITY;
+    nextUsedAi     = 0;
+  } else if (isDowngrade) {
+    // Downgrade: Verbrauch zurücksetzen
+    nextLeftSlides = Number.isFinite(newTotalSlides) ? newTotalSlides as number : 0;
+    nextUsedSlides = 0;
+    nextLeftAi     = Number.isFinite(newTotalAi) ? newTotalAi as number : 0;
+    nextUsedAi     = 0;
+  } else {
+    // Gleichbleibend oder Upgrade: used bleibt
+    nextUsedSlides = Math.max(0, inferredUsedSlides);
+    nextLeftSlides = Number.isFinite(newTotalSlides)
+      ? Math.max(0, (newTotalSlides as number) - nextUsedSlides)
+      : Number.POSITIVE_INFINITY;
+
+    nextUsedAi = Math.max(0, inferredUsedAi);
+    nextLeftAi = Number.isFinite(newTotalAi)
+      ? Math.max(0, (newTotalAi as number) - nextUsedAi)
+      : Number.POSITIVE_INFINITY;
+  }
+
+  // Altbalance weg → sauberen Datensatz schreiben
+  if (prev) {
+    await tx.creditBalance.delete({ where: { userId } });
+  }
+  await tx.creditBalance.create({
+    data: {
+      userId,
+      credits: Number.isFinite(nextLeftSlides) ? nextLeftSlides : 0,
+      aiCredits: Number.isFinite(nextLeftAi) ? nextLeftAi : 0,
+      usedCredits: Number.isFinite(nextLeftSlides) ? nextUsedSlides : 0,
+      usedAiCredits: Number.isFinite(nextLeftAi) ? nextUsedAi : 0,
+      resetsAt: newPeriodEnd,
+    },
+  });
+}
+
 export async function getUsageLimits(userId: string) {
   const [sub, bal] = await Promise.all([
     db.subscription.findFirst({
       where: { userId, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
       orderBy: { updatedAt: "desc" },
@@
   return { plan, unlimited, slidesLeft, aiLeft };
 }
 
 type ConsumeArgs =
   | { kind: "slide"; cost?: number }
   | { kind: "ai"; cost?: number };
 
 export async function ensureAndConsumeCredits(userId: string, args: ConsumeArgs) {
   const cost = Math.max(1, args.cost ?? (args.kind === "ai" ? 2 : 1));
   return await db.$transaction(async (tx) => {
@@
-    let bal = await tx.creditBalance.findUnique({ where: { userId } });
-    if (!bal) {
-      bal = await tx.creditBalance.create({
-        data: {
-          userId,
-          credits: !plan ? FREE_SLIDESHOW_QUOTA : 0,
-          aiCredits: 0,
-          usedCredits: 0,
-          usedAiCredits: 0,
-          resetsAt: null,
-        },
-      });
-    }
+    let bal = await tx.creditBalance.findUnique({ where: { userId } });
+    if (!bal) {
+      // Free-Init: IMMER 5/0 – nie 250/300
+      bal = await tx.creditBalance.create({
+        data: {
+          userId,
+          credits: !plan ? FREE_SLIDESHOW_QUOTA : 0,
+          aiCredits: 0,
+          usedCredits: 0,
+          usedAiCredits: 0,
+          resetsAt: null,
+        },
+      });
+    }
 
     if (unlimited) return { ok: true as const };
 
     if (args.kind === "slide") {
       const updated = await tx.creditBalance.updateMany({
*** End Patch
diff
Code kopieren
*** Begin Patch
*** Update File: src/app/api/billing/sync/route.ts
@@
 import { stripe } from "@/server/stripe";
-import { planFromPrice } from "@/server/billing";
+import { planFromPrice, carryOverCreditsOnPlanChange } from "@/server/billing";
 import { PLAN_CREDITS } from "@/lib/billing";
-import { carryOverCreditsOnPlanChange } from "@/server/billing";
+import { FREE_SLIDESHOW_QUOTA } from "@/lib/billing";
@@
     if (!active) {
-      // Kein aktives Abo -> auf Free setzen
+      // Kein aktives Abo -> FREE (5/0) hart setzen und Altstände aufräumen
       await db.user.update({
         where: { id: user.id },
         data: { plan: null, planRenewsAt: null },
       });
+      await db.$transaction(async (tx) => {
+        const prev = await tx.creditBalance.findUnique({ where: { userId: user.id } });
+        if (prev) await tx.creditBalance.delete({ where: { userId: user.id } });
+        await tx.creditBalance.create({
+          data: {
+            userId: user.id,
+            credits: FREE_SLIDESHOW_QUOTA, // 5
+            aiCredits: 0,
+            usedCredits: 0,
+            usedAiCredits: 0,
+            resetsAt: null,
+          },
+        });
+      });
       return NextResponse.json({ synced: true, plan: null });
     }
@@
-    await db.subscription.upsert({
+    await db.subscription.upsert({
       where: { stripeSubscriptionId: active.id },
       create: {
         userId: user.id,
         stripeSubscriptionId: active.id,
         stripePriceId: priceId ?? null,
         status: (active.status as string).toUpperCase() as any,
         currentPeriodEnd: periodEnd,
       },
       update: {
         stripePriceId: priceId ?? null,
         status: (active.status as string).toUpperCase() as any,
         currentPeriodEnd: periodEnd,
       },
     });
 
-      // 5) Credits & User-Plan via Carry-Over/Reset setzen
+    // 5) Credits & User-Plan via Carry-Over/Reset setzen (hart neu schreiben)
     await db.$transaction(async (tx) => {
       const oldPlan = (await tx.user.findUnique({ where: { id: user.id }, select: { plan: true } }))?.plan ?? null;
       await carryOverCreditsOnPlanChange(tx, user.id, oldPlan, plan, periodEnd);
       await tx.user.update({
         where: { id: user.id },
         data: {
           plan,
           planSince: user.plan ? user.planSince : periodStart,
           planRenewsAt: periodEnd,
         },
       });
     });
*** End Patch
diff
Code kopieren
*** Begin Patch
*** Update File: src/app/api/billing/usage/route.ts
@@
   const latestSub = user?.subscriptions?.[0] ?? null;
   const hasPlan = !!user?.plan;
+  // Bei Free-Plan keine „0 left“-Falle durch alte Balance:
+  // Falls kein Plan und keine Balance vorhanden → 5/0 zurückgeben (UI zeigt dann korrekt 0/5 verwendet)
+  const freeCredits = !hasPlan
+    ? (user?.creditBalance?.credits ?? 5)
+    : null;
+  const freeAi = !hasPlan
+    ? (user?.creditBalance?.aiCredits ?? 0)
+    : null;
   return NextResponse.json({
     plan: hasPlan ? user!.plan : null,
     status: latestSub?.status ?? null,
-    credits: hasPlan ? user?.creditBalance?.credits ?? 0 : null,
-    aiCredits: hasPlan ? user?.creditBalance?.aiCredits ?? 0 : null,
-    resetsAt: hasPlan ? (user?.creditBalance?.resetsAt ?? user?.planRenewsAt ?? null) : null,
+    credits: hasPlan ? (user?.creditBalance?.credits ?? 0) : freeCredits,
+    aiCredits: hasPlan ? (user?.creditBalance?.aiCredits ?? 0) : freeAi,
+    resetsAt: hasPlan ? (user?.creditBalance?.resetsAt ?? user?.planRenewsAt ?? null) : null,
     stripePriceId: latestSub?.stripePriceId ?? null,
     stripeSubscriptionId: latestSub?.stripeSubscriptionId ?? null,
     hasCustomer: !!user?.stripeCustomerId,
     hasSubscription: !!latestSub?.stripeSubscriptionId,
   });
*** End Patch