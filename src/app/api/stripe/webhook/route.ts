import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/server/stripe";
import { db } from "@/server/db";
import { PLAN_CREDITS, planFromPrice } from "@/lib/billing";


function dateFromUnixOrFallback(unix?: number | null): Date {
  if (typeof unix === "number" && Number.isFinite(unix)) {
    return new Date(unix * 1000);
  }
  // Fallback: +30 Tage – nur als Sicherheitsnetz, in der Praxis
  // kommt kurz danach ein invoice.payment_succeeded mit korrektem Wert.
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

export async function POST(req: Request) {
  const sig = (await headers()).get("stripe-signature");
  const raw = await req.text();

  let evt;
  try {
    evt = stripe.webhooks.constructEvent(raw, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e) {
    return new NextResponse(`Webhook Error: ${(e as Error).message}`, { status: 400 });
  }

  try {
    switch (evt.type) {
      case "checkout.session.completed": {
        const session = evt.data.object as any;
        const customerId = session.customer as string;
        const subId = session.subscription as string | undefined;

        const user =
          (await db.user.findFirst({ where: { stripeCustomerId: customerId } })) ??
          (session.metadata?.userId
            ? await db.user.findUnique({ where: { id: session.metadata.userId } })
            : null);
        if (!user) break;

        if (!user.stripeCustomerId && customerId) {
          await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
        }

        if (subId) {
          // Achtung: Direkt nach Checkout kann Stripe Sub-Daten noch nachreichen.
          // Wir holen sie und nutzen Fallbacks.
          const subscription = await stripe.subscriptions.retrieve(subId);
          const priceId = subscription.items.data[0]?.price?.id as string | undefined;
          const plan = planFromPrice(priceId);
          if (!plan) break;

          await db.subscription.upsert({
            where: { stripeSubscriptionId: subId },
            create: {
              userId: user.id,
              stripeSubscriptionId: subId,
              stripePriceId: priceId,
              status: "ACTIVE",
              currentPeriodEnd: dateFromUnixOrFallback(subscription.current_period_end),
            },
            update: {
              stripePriceId: priceId,
              status: "ACTIVE",
              currentPeriodEnd: dateFromUnixOrFallback(subscription.current_period_end),
            },
          });

          await db.user.update({
            where: { id: user.id },
            data: {
              plan,
              planSince: new Date(),
              planRenewsAt: dateFromUnixOrFallback(subscription.current_period_end),
            },
          });

          const pack = PLAN_CREDITS[plan as keyof typeof PLAN_CREDITS];
          await db.creditBalance.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              credits: pack.credits,
              aiCredits: pack.ai,
              resetsAt: dateFromUnixOrFallback(subscription.current_period_end),
            },
            update: {
              credits: pack.credits,
              aiCredits: pack.ai,
              resetsAt: dateFromUnixOrFallback(subscription.current_period_end),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = evt.data.object as any; // enthält current_period_end direkt
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id as string;
        const plan = planFromPrice(priceId as string);
        if (!plan) break;

        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (!user) break;

        // >>> NEW: Detect plan change and top up the difference (no hard reset mid-cycle)
        const previousPlan = user.plan ?? "STARTER";
        if (previousPlan !== plan) {
          const prevPack = PLAN_CREDITS[previousPlan];
          const newPack = PLAN_CREDITS[plan];
          // only top-up on upgrade (credits must increase and not UNLIMITED→finite)
          const isUpgrade =
            (prevPack.credits >= 0 && newPack.credits > prevPack.credits) ||
            (prevPack.credits < 0 && newPack.credits >= 0) || // Unlimited -> finite (edge) => skip top-up
            (prevPack.credits >= 0 && newPack.credits < 0);    // finite -> Unlimited: no need to top-up

          if (isUpgrade && prevPack.credits >= 0 && newPack.credits >= 0) {
            const diffCredits = newPack.credits - prevPack.credits;
            const diffAi = Math.max(0, newPack.ai - prevPack.ai);
            await db.creditBalance.upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                credits: prevPack.credits + diffCredits,
                aiCredits: Math.max(prevPack.ai, 0) + diffAi,
                resetsAt: new Date(sub.current_period_end * 1000),
              },
              update: {
                credits: { increment: diffCredits },
                aiCredits: { increment: diffAi },
                resetsAt: new Date(sub.current_period_end * 1000),
              },
            });
          }
        }

        const periodEnd = dateFromUnixOrFallback(sub.current_period_end);
        await db.subscription.upsert({
          where: { stripeSubscriptionId: sub.id },
          create: {
            userId: user.id,
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            status: (sub.status as string).toUpperCase() as any,
            currentPeriodEnd: periodEnd,
          },
          update: {
            stripePriceId: priceId,
            status: (sub.status as string).toUpperCase() as any,
            currentPeriodEnd: periodEnd,
          },
        });

        await db.user.update({
          where: { id: user.id },
          data: { plan, planRenewsAt: periodEnd },
        });
        break;
      }

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

        // Kein bezahlter Plan mehr → auf "Free" (null) setzen
        await db.user.update({ where: { id: user.id }, data: { plan: null, planRenewsAt: null } });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = evt.data.object as any;
        const subId = invoice.subscription as string;
        if (!subId) break;

        const sub = await stripe.subscriptions.retrieve(subId);
        const customerId = sub.customer as string;
        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (!user || !user.plan) break;

        const pack = PLAN_CREDITS[user.plan as keyof typeof PLAN_CREDITS];
        await db.creditBalance.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            credits: pack.credits,
            aiCredits: pack.ai,
            resetsAt: new Date(sub.current_period_end * 1000),
          },
          update: {
            credits: pack.credits,
            aiCredits: pack.ai,
            resetsAt: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[STRIPE][WEBHOOK] Error:", err);
    return new NextResponse(
      "Webhook handler failed: " + (err instanceof Error ? err.message : JSON.stringify(err)),
      { status: 500 }
    );
  }
}