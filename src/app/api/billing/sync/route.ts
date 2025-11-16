import { FREE_SLIDESHOW_QUOTA } from "@/lib/billing";
import { auth } from "@/server/auth";
import {
  carryOverCreditsOnPlanChange,
  isActiveStripeSubscriptionStatus,
  mapStripeSubscriptionStatus,
  planFromPrice,
} from "@/server/billing";
import { db } from "@/server/db";
import { stripe } from "@/server/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

function dateFromUnix(sec?: number | null) {
  return sec ? new Date(sec * 1000) : new Date();
}

type SubscriptionWithPeriods = Stripe.Subscription & {
  current_period_start?: number | null;
  current_period_end?: number | null;
};

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        plan: true,
        planSince: true,
        planRenewsAt: true,
        stripeCustomerId: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer for user" },
        { status: 400 },
      );
    }

    const subs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      expand: ["data.items.data.price"],
      limit: 10,
    });

    const subscriptionData = subs.data as SubscriptionWithPeriods[];
    const active = subscriptionData.find((s): s is SubscriptionWithPeriods =>
      isActiveStripeSubscriptionStatus(s.status),
    );

    if (!active) {
      await db.user.update({
        where: { id: user.id },
        data: { plan: null, planRenewsAt: null },
      });
      await db.$transaction(async (tx) => {
        const prev = await tx.creditBalance.findUnique({
          where: { userId: user.id },
        });
        if (prev) await tx.creditBalance.delete({ where: { userId: user.id } });
        await tx.creditBalance.create({
          data: {
            userId: user.id,
            credits: FREE_SLIDESHOW_QUOTA,
            aiCredits: 0,
            usedCredits: 0,
            usedAiCredits: 0,
            resetsAt: null,
          },
        });
      });
      return NextResponse.json({ synced: true, plan: null });
    }

    const firstItem = active.items?.data?.[0];
    const rawPrice = firstItem?.price;
    const priceId =
      typeof rawPrice === "string" ? rawPrice : (rawPrice?.id ?? undefined);
    if (!priceId) {
      return NextResponse.json(
        {
          error: "Active subscription missing price id",
          hint: "Ensure subscription items expand price data",
        },
        { status: 400 },
      );
    }

    const plan = planFromPrice(priceId);
    if (!plan) {
      return NextResponse.json(
        {
          error: "Unknown price mapping",
          hint: "Check STRIPE_PRICE_* env vars (must be price_... IDs, not product IDs)",
          priceId,
        },
        { status: 400 },
      );
    }

    const periodStart = dateFromUnix(active.current_period_start ?? null);
    const periodEnd = dateFromUnix(active.current_period_end ?? null);
    const status = mapStripeSubscriptionStatus(active.status);

    await db.subscription.upsert({
      where: { stripeSubscriptionId: active.id },
      create: {
        userId: user.id,
        stripeSubscriptionId: active.id,
        stripePriceId: priceId,
        status,
        currentPeriodEnd: periodEnd,
      },
      update: {
        stripePriceId: priceId,
        status,
        currentPeriodEnd: periodEnd,
      },
    });

    await db.$transaction(async (tx) => {
      const oldPlan =
        (
          await tx.user.findUnique({
            where: { id: user.id },
            select: { plan: true },
          })
        )?.plan ?? null;
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

    return NextResponse.json({
      synced: true,
      plan,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 },
    );
  }
}
