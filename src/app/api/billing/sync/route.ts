import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { stripe } from "@/server/stripe";
import { planFromPrice, carryOverCreditsOnPlanChange } from "@/server/billing";
import { PLAN_CREDITS } from "@/lib/billing";
import { FREE_SLIDESHOW_QUOTA } from "@/lib/billing";

// Kleine Helper, um leere/kaputte Zeiten zu vermeiden
function dateFromUnix(sec?: number | null) {
  return sec ? new Date(sec * 1000) : new Date();
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1) User + Customer
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
      return NextResponse.json({ error: "No Stripe customer for user" }, { status: 400 });
    }

    // 2) Subscriptions aus Stripe lesen
    const subs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      // WICHTIG: bei list → "data.items.data.price" expanden
      expand: ["data.items.data.price"],
      limit: 10,
    });

    // aktive / relevante Sub finden
    const active = subs.data.find((s) =>
      ["active", "trialing", "past_due", "incomplete"].includes(s.status)
    );

    if (!active) {
      // Kein aktives Abo -> FREE (5/0) hart setzen und Altstände aufräumen
      await db.user.update({
        where: { id: user.id },
        data: { plan: null, planRenewsAt: null },
      });
      await db.$transaction(async (tx) => {
        const prev = await tx.creditBalance.findUnique({ where: { userId: user.id } });
        if (prev) await tx.creditBalance.delete({ where: { userId: user.id } });
        await tx.creditBalance.create({
          data: {
            userId: user.id,
            credits: FREE_SLIDESHOW_QUOTA, // 5
            aiCredits: 0,
            usedCredits: 0,
            usedAiCredits: 0,
            resetsAt: null,
          },
        });
      });
      return NextResponse.json({ synced: true, plan: null });
    }

    // 3) Plan aus Price-ID ableiten (ENV müssen korrekt gesetzt sein)
    // Nach dem Expand ist price ein Objekt
    const priceId = (active.items?.data?.[0]?.price as { id?: string } | undefined)?.id;
    const plan = planFromPrice(priceId);
    console.log("[/api/billing/sync] priceId:", priceId, "→ plan:", plan);
    if (!plan) {
      return NextResponse.json(
        {
          error: "Unknown price mapping",
          hint: "Check STRIPE_PRICE_* env vars (must be price_... IDs, not product IDs)",
          priceId,
        },
        { status: 400 }
      );
    }

    const periodStart = dateFromUnix(active.current_period_start);
    const periodEnd = dateFromUnix(active.current_period_end);

    // 4) Subscription upsert
      await db.subscription.upsert({
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

    // 5) Credits & User-Plan via Carry-Over/Reset setzen (hart neu schreiben)
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

    return NextResponse.json({
      synced: true,
      plan,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    });
  } catch (err: any) {
    // Immer JSON zurückgeben – kein "Unexpected end of JSON input" mehr
    console.error("[/api/billing/sync] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}