// server-only Funktionen rund um Billing/Credits
import "server-only";
import { db } from "@/server/db";
import { env } from "@/env";
import type {
  CreditBalance,
  Plan,
  Prisma,
  SubscriptionStatus,
} from "@prisma/client";
import type Stripe from "stripe";
import { PLAN_CREDITS, FREE_SLIDESHOW_QUOTA } from "@/lib/billing";
import { redis } from "@/server/redis";

type BillingTransactionClient = Prisma.TransactionClient;

const PLAN_PRICE_MAPPINGS: Array<{ plan: Plan; ids: string[] }> = [
  {
    plan: "STARTER",
    ids: [env.STRIPE_PRICE_STARTER_MONTHLY, env.STRIPE_PRICE_STARTER_YEARLY],
  },
  {
    plan: "GROWTH",
    ids: [env.STRIPE_PRICE_GROWTH_MONTHLY, env.STRIPE_PRICE_GROWTH_YEARLY],
  },
  {
    plan: "SCALE",
    ids: [env.STRIPE_PRICE_SCALE_MONTHLY, env.STRIPE_PRICE_SCALE_YEARLY],
  },
  {
    plan: "UNLIMITED",
    ids: [
      env.STRIPE_PRICE_UNLIMITED_MONTHLY,
      env.STRIPE_PRICE_UNLIMITED_YEARLY,
    ],
  },
];

export function planFromPrice(priceId?: string): Plan | undefined {
  if (!priceId) return undefined;
  for (const { plan, ids } of PLAN_PRICE_MAPPINGS) {
    if (ids.includes(priceId)) return plan;
  }
  return undefined;
}

export async function normalizeCreditBalance(
  tx: BillingTransactionClient,
  userId: string,
): Promise<CreditBalance | null> {
  const records = await tx.creditBalance.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (records.length === 0) return null;
  if (records.length === 1) return records[0]!;

  const latest = records[0]!;
  await tx.creditBalance.deleteMany({ where: { userId } });
  const normalized = await tx.creditBalance.create({
    data: {
      userId,
      credits: latest.credits,
      aiCredits: latest.aiCredits,
      usedCredits: latest.usedCredits,
      usedAiCredits: latest.usedAiCredits,
      resetsAt: latest.resetsAt,
    },
  });
  return normalized;
}

export async function getUsageLimits(userId: string) {
  return await db.$transaction(async (tx) => {
    const [userRecord, rawBal] = await Promise.all([
      tx.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      }),
      normalizeCreditBalance(tx, userId),
    ]);
    let bal = rawBal;

    const plan = userRecord?.plan ?? null;
    const allowances = plan ? PLAN_CREDITS[plan] : null;
    const unlimitedSlides = !!allowances && allowances.credits < 0;
    const unlimitedAi = !!allowances && allowances.ai < 0;

    if (bal && allowances) {
      const updates: Record<string, number> = {};
      if (allowances.credits < 0 && bal.credits !== -1) {
        updates.credits = -1;
      } else if (allowances.credits >= 0 && bal.credits < 0) {
        updates.credits = allowances.credits;
      }
      if (allowances.ai < 0 && bal.aiCredits !== -1) {
        updates.aiCredits = -1;
      } else if (allowances.ai >= 0 && bal.aiCredits < 0) {
        updates.aiCredits = allowances.ai;
      }
      if (Object.keys(updates).length > 0) {
        bal = await tx.creditBalance.update({
          where: { userId },
          data: updates,
        });
      }
    }

    const storedSlides = bal?.credits ?? null;
    const storedAi = bal?.aiCredits ?? null;

    let slidesLeft: number;
    if (!plan) {
      const freeCredits = storedSlides ?? FREE_SLIDESHOW_QUOTA;
      slidesLeft = Math.max(0, freeCredits);
    } else if (unlimitedSlides || (storedSlides ?? 0) < 0) {
      slidesLeft = Number.POSITIVE_INFINITY;
    } else {
      const fallback = allowances?.credits ?? 0;
      slidesLeft = Math.max(0, storedSlides ?? fallback);
    }

    let aiLeft: number;
    if (!plan) {
      aiLeft = Math.max(0, storedAi ?? 0);
    } else if (unlimitedAi || (storedAi ?? 0) < 0) {
      aiLeft = Number.POSITIVE_INFINITY;
    } else {
      const fallback = allowances?.ai ?? 0;
      aiLeft = Math.max(0, storedAi ?? fallback);
    }

    const result = { plan, unlimited: unlimitedSlides, slidesLeft, aiLeft };
    return result;
  });
}

type ConsumeArgs =
  | { kind: "slide"; cost?: number }
  | { kind: "ai"; cost?: number };

export async function ensureAndConsumeCredits(userId: string, args: ConsumeArgs) {
  const cost = Math.max(1, args.cost ?? (args.kind === "ai" ? 2 : 1));
  console.debug("[billing] ensureAndConsumeCredits:start", { userId, args, cost });
  // 🧩 Verbesserter Redis-Lock (auto-refresh + safe release)
  const redis = globalThis.redis;
  const redisKey = `creditlock:${userId}`;
  const lockTTL = 5000; // 5 Sekunden Sicherheitsfenster

  // Versuche Lock mehrfach, falls er hängt
  let acquired = false;
  try {
    // Wenn Redis nicht verbunden ist, nicht versuchen
    // (node-redis v4 hat isOpen / isReady; wir nutzen das defensiv)
    const canUseRedis = !!redis && (redis as any).isOpen !== false;
    if (canUseRedis) {
      for (let i = 0; i < 5; i++) {
        const ok = await redis?.set(redisKey, "1", { NX: true, PX: lockTTL });
        if (ok) { acquired = true; break; }
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    if (!acquired) {
      // ❗ Kein Hard-Fail mehr – wir verlassen uns auf den DB-Row-Lock (SELECT … FOR UPDATE)
      console.warn(`[billing] ⚠️ Proceeding without Redis lock for user ${userId} (falling back to DB row lock)`);
    }
  } catch (e) {
    // Ebenfalls kein Hard-Fail – Redis kann fehlen, DB-Sperre bleibt robust
    console.warn(`[billing] ⚠️ Redis lock attempt failed for user ${userId}, using DB row lock`, e);
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // 🔒 Row-Lock gegen Race-Conditions (SELECT FOR UPDATE)
      await tx.$executeRawUnsafe(`SELECT * FROM "CreditBalance" WHERE "userId" = $1 FOR UPDATE`, userId);
    const [sub, userRecord] = await Promise.all([
      tx.subscription.findFirst({
        where: { userId, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
        orderBy: { updatedAt: "desc" },
      }),
      tx.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    ]);
    const plan = userRecord?.plan ?? null;
    const allowances = plan ? PLAN_CREDITS[plan] : null;
    const unlimitedSlides = !!allowances && allowances.credits < 0;
    const unlimitedAi = !!allowances && allowances.ai < 0;

    let bal = await normalizeCreditBalance(tx, userId);
    console.debug("[billing] ensureAndConsumeCredits:balanceLoaded", { userId, plan, bal });
    if (!bal) {
      const defaultCredits =
        !plan
          ? FREE_SLIDESHOW_QUOTA
          : allowances
            ? allowances.credits < 0
              ? -1
              : allowances.credits
            : 0;
      const defaultAi =
        !plan
          ? 0
          : allowances
            ? allowances.ai < 0
              ? -1
              : allowances.ai
            : 0;
      bal = await tx.creditBalance.create({
        data: {
          userId,
          credits: defaultCredits,
          aiCredits: defaultAi,
          usedCredits: 0,
          usedAiCredits: 0,
          resetsAt: sub?.currentPeriodEnd ?? null,
        },
      });
      console.debug("[billing] ensureAndConsumeCredits:createBalance", { userId, plan, bal });
    } else if (allowances) {
      const updates: Record<string, number> = {};
      if (allowances.credits < 0 && bal.credits !== -1) {
        updates.credits = -1;
      } else if (allowances.credits >= 0 && bal.credits < 0) {
        updates.credits = allowances.credits;
      }
      if (allowances.ai < 0 && bal.aiCredits !== -1) {
        updates.aiCredits = -1;
      } else if (allowances.ai >= 0 && bal.aiCredits < 0) {
        updates.aiCredits = allowances.ai;
      }
      if (Object.keys(updates).length > 0) {
        bal = await tx.creditBalance.update({
          where: { userId },
          data: updates,
        });
        console.debug("[billing] ensureAndConsumeCredits:updateSentinels", { userId, updates, bal });
      }
    }

    if (args.kind === "slide") {
      if (unlimitedSlides) return { ok: true as const };
      const updated = await tx.creditBalance.updateMany({
        where: { userId, credits: { gte: cost } },
        data: { credits: { decrement: cost }, usedCredits: { increment: cost } },
      });
      if (updated.count === 0) {
        console.warn("[billing] ensureAndConsumeCredits:slideInsufficient", { userId, cost, credits: bal?.credits });
        const err: any = new Error("INSUFFICIENT_SLIDE_CREDITS");
        err.code = "INSUFFICIENT_SLIDE_CREDITS";
        throw err;
      }

    // 🔄 Notify frontend to update sidebar usage (credits live refresh)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/billing/usage/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) console.warn("Usage revalidate failed");
    } catch (e) {
      console.warn("Usage refresh call failed", e);
    }

      return { ok: true as const };
    }

    const updated = await tx.creditBalance.updateMany({
      where: {
        userId,
        ...(unlimitedAi ? {} : { aiCredits: { gte: cost } }),
      },
      data: unlimitedAi
        ? { usedAiCredits: { increment: cost } }
        : { aiCredits: { decrement: cost }, usedAiCredits: { increment: cost } },
    });
    if (updated.count === 0) {
      console.warn("[billing] ensureAndConsumeCredits:aiInsufficient", { userId, cost, aiCredits: bal?.aiCredits });
      const err: any = new Error("INSUFFICIENT_AI_CREDITS");
      err.code = "INSUFFICIENT_AI_CREDITS";
      throw err;
    }

    // 🔄 Notify frontend to update sidebar usage (credits live refresh)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/billing/usage/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) console.warn("Usage revalidate failed");
    } catch (e) {
      console.warn("Usage refresh call failed", e);
    }

    console.debug("[billing] ensureAndConsumeCredits:success", { userId, kind: args.kind, cost });
    return { ok: true as const };
    });

    return result;
  } finally {
    // Nur freigeben, wenn auch wirklich erworben
    if (acquired) {
      try {
        await redis?.del(redisKey);
        console.debug(`[billing] 🔓 Lock released for user ${userId}`);
      } catch (err) {
        console.warn(`[billing] ⚠️ Failed to release lock for user ${userId}`, err);
      }
    }
  }
}

/**
 * Rewrites the credit balance for a target plan.
 * - Downgrade: usage reset to 0
 * - Upgrade:   usage carried over and remaining = new quota - used
 * - Unlimited: stored as sentinel -1 with usage reset
 */
export async function carryOverCreditsOnPlanChange(
  tx: BillingTransactionClient,
  userId: string,
  oldPlan: Plan | null,
  newPlan: Plan,
  newPeriodEnd: Date | null,
) {
  console.debug("[billing] carryOverCreditsOnPlanChange:start", { userId, oldPlan, newPlan, newPeriodEnd });
  const prevEntries = await tx.creditBalance.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  const prev = prevEntries[0] ?? null;
  console.debug("[billing] carryOverCreditsOnPlanChange:prevEntries", {
    userId,
    count: prevEntries.length,
    prev,
  });

  await tx.creditBalance.deleteMany({ where: { userId } });

  // Altdaten sichern
  const prevUsedSlides   = prev?.usedCredits    ?? 0;
  const prevUsedAi       = prev?.usedAiCredits  ?? 0;
  const prevLeftSlides   = prev?.credits        ?? 0;
  const prevLeftAi       = prev?.aiCredits      ?? 0;
  const prevLeftSlidesFinite = prevLeftSlides < 0 ? null : prevLeftSlides;
  const prevLeftAiFinite = prevLeftAi < 0 ? null : prevLeftAi;

  // Neues Kontingent ermitteln
  const target = PLAN_CREDITS[newPlan];
  const newTotalSlides = target.credits < 0 ? Number.POSITIVE_INFINITY : target.credits;
  const newTotalAi     = target.ai      < 0 ? Number.POSITIVE_INFINITY : target.ai;

  const isUnlimited  = newPlan === "UNLIMITED";
  const isDowngrade  =
    !isUnlimited &&
    (oldPlan && PLAN_CREDITS[oldPlan].credits > 0) &&
    (PLAN_CREDITS[oldPlan].credits > PLAN_CREDITS[newPlan].credits);

  // Determine used values in a robust way:
  // a) Prefer stored used counters if present
  // b) Otherwise derive from remaining credits when the old plan was finite
  const inferredUsedSlides = Number.isFinite(newTotalSlides)
    ? (prevUsedSlides || (oldPlan && oldPlan !== "UNLIMITED" && PLAN_CREDITS[oldPlan].credits >= 0 && prevLeftSlidesFinite != null
        ? Math.max(0, PLAN_CREDITS[oldPlan].credits - prevLeftSlidesFinite)
        : 0))
    : 0;
  const inferredUsedAi = Number.isFinite(newTotalAi)
    ? (prevUsedAi || (oldPlan && PLAN_CREDITS[oldPlan].ai >= 0 && prevLeftAiFinite != null
        ? Math.max(0, (PLAN_CREDITS[oldPlan].ai) - prevLeftAiFinite)
        : 0))
    : 0;

  const finiteSlideQuota = Number.isFinite(newTotalSlides) ? (newTotalSlides as number) : null;
  const finiteAiQuota    = Number.isFinite(newTotalAi)     ? (newTotalAi as number)     : null;

  let nextUsedSlides = Math.max(0, inferredUsedSlides);
  if (finiteSlideQuota != null) {
    nextUsedSlides = Math.min(finiteSlideQuota, nextUsedSlides);
  }
  let nextLeftSlides = finiteSlideQuota != null
    ? Math.max(0, finiteSlideQuota - nextUsedSlides)
    : Number.POSITIVE_INFINITY;

  let nextUsedAi = Math.max(0, inferredUsedAi);
  if (finiteAiQuota != null) {
    nextUsedAi = Math.min(finiteAiQuota, nextUsedAi);
  }
  let nextLeftAi = finiteAiQuota != null
    ? Math.max(0, finiteAiQuota - nextUsedAi)
    : Number.POSITIVE_INFINITY;

  if (isDowngrade) {
    nextUsedSlides = 0;
    nextLeftSlides = finiteSlideQuota != null ? finiteSlideQuota : Number.POSITIVE_INFINITY;
    nextUsedAi = 0;
    nextLeftAi = finiteAiQuota != null ? finiteAiQuota : Number.POSITIVE_INFINITY;
  }

  // Persist cleaned balance row
  const storedCredits = finiteSlideQuota != null
    ? Math.max(0, Math.trunc(nextLeftSlides))
    : -1;
  const storedAiCredits = finiteAiQuota != null
    ? Math.max(0, Math.trunc(nextLeftAi))
    : -1;

  console.debug("[billing] carryOverCreditsOnPlanChange:computed", {
    userId,
    nextLeftSlides,
    nextUsedSlides,
    nextLeftAi,
    nextUsedAi,
    storedCredits,
    storedAiCredits,
  });
  await tx.creditBalance.create({
    data: {
      userId,
      credits: storedCredits,
      aiCredits: storedAiCredits,
      usedCredits: Math.max(0, Math.trunc(nextUsedSlides)),
      usedAiCredits: Math.max(0, Math.trunc(nextUsedAi)),
      resetsAt: newPeriodEnd,
    },
  });
  console.debug("[billing] carryOverCreditsOnPlanChange:end", { userId, newPlan, storedCredits, storedAiCredits, newPeriodEnd });
}

const STRIPE_STATUS_MAP: Record<Stripe.Subscription.Status, SubscriptionStatus> =
  {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    paused: "PAST_DUE",
  };

const ACTIVE_STRIPE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "incomplete",
]);

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  return STRIPE_STATUS_MAP[status] ?? "INCOMPLETE";
}

export function isActiveStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): boolean {
  return ACTIVE_STRIPE_STATUSES.has(status);
}

export async function resetAllCredits(
  tx: Prisma.TransactionClient,
  userId: string,
  plan: Plan,
  nextResetAt: Date
) {
  const limits = PLAN_CREDITS?.[plan] ?? { credits: 0, ai: 0 };
  const slides = Number.isFinite(limits.credits) ? limits.credits : 0;
  const ai = Number.isFinite(limits.ai) ? limits.ai : 0;

  if (!PLAN_CREDITS?.[plan]) {
    console.warn("[resetAllCredits] ⚠️ unknown plan:", plan, "→ using defaults");
  }

  await tx.creditBalance.deleteMany({ where: { userId } });
  await tx.creditBalance.create({
    data: {
      userId,
      credits: slides,
      aiCredits: ai,
      usedCredits: 0,
      usedAiCredits: 0,
      resetsAt: nextResetAt,
    },
  });

  console.log(
    `[resetAllCredits] ✅ balance reset for ${plan} → slides=${slides}, ai=${ai}`
  );
}
