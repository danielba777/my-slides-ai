import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/server/stripe";
import { db } from "@/server/db";
import { FREE_SLIDESHOW_QUOTA } from "@/lib/billing";
import { planFromPrice, carryOverCreditsOnPlanChange } from "@/server/billing";


function dateFromUnixOrFallback(unix?: number | null): Date {
  if (typeof unix === "number" && Number.isFinite(unix)) {
    return new Date(unix * 1000);
  }
  // Fallback: +30 Tage  nur als Sicherheitsnetz, in der Praxis
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

        if (subId) {
          // Achtung: Direkt nach Checkout kann Stripe Sub-Daten noch nachreichen.
          // Wir holen sie und nutzen Fallbacks.
          const subscription = await stripe.subscriptions.retrieve(subId);
          const priceId = subscription.items.data[0]?.price?.id as string | undefined;
          const plan = planFromPrice(priceId);
          console.log("[webhook]", evt.type, "priceId:", priceId, " plan:", plan);
          if (!plan) break;

          const periodStart = subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : new Date();
          const periodEnd = dateFromUnixOrFallback(subscription.current_period_end);

          await db.$transaction(async (tx) => {
            const dbUser = await tx.user.findUnique({
              where: { id: user.id },
              select: { plan: true, planSince: true, stripeCustomerId: true },
            });
            if (!dbUser) return;

            const oldPlan = dbUser.plan ?? null;

            await tx.subscription.upsert({
              where: { stripeSubscriptionId: subId },
              create: {
                userId: user.id,
                stripeSubscriptionId: subId,
                stripePriceId: priceId,
                status: "ACTIVE",
                currentPeriodEnd: periodEnd,
              },
              update: {
                stripePriceId: priceId,
                status: "ACTIVE",
                currentPeriodEnd: periodEnd,
              },
            });

            await carryOverCreditsOnPlanChange(
              tx,
              user.id,
              oldPlan,
              plan,
              periodEnd,
            );

            const planSince =
              oldPlan && oldPlan === plan
                ? (dbUser.planSince ?? periodStart)
                : periodStart;
            const userUpdate: {
              plan: typeof plan;
              planSince: Date | null;
              planRenewsAt: Date | null;
              stripeCustomerId?: string;
            } = {
              plan,
              planSince,
              planRenewsAt: periodEnd,
            };
            if (!dbUser.stripeCustomerId && customerId) {
              userUpdate.stripeCustomerId = customerId;
            }

            await tx.user.update({
              where: { id: user.id },
              data: userUpdate,
            });
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = evt.data.object as any;
        const customerId = sub.customer as string;
        const priceId = sub.items?.data?.[0]?.price?.id as string | undefined;
        const plan = planFromPrice(priceId);
        console.log("[webhook]", evt.type, "priceId:", priceId, " plan:", plan);
        if (!customerId || !plan) break;

        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (!user) break;

        const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000) : new Date();
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : dateFromUnixOrFallback(null);

        await db.subscription.upsert({
          where: { stripeSubscriptionId: sub.id },
          create: {
            userId: user.id,
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId ?? null,
            status: (sub.status as string).toUpperCase() as any,
            currentPeriodEnd: periodEnd,
          },
          update: {
            stripePriceId: priceId ?? null,
            status: (sub.status as string).toUpperCase() as any,
            currentPeriodEnd: periodEnd,
          },
        });

        await db.user.update({
          where: { id: user.id },
          data: { plan, planSince: user.plan ? user.planSince : periodStart, planRenewsAt: periodEnd },
        });

              // Credits NICHT hart zurcksetzen  Umstellung wird bei Invoice korrigiert.
        break;
      }

      case "customer.subscription.deleted": {
        const sub = evt.data.object as any;
        const user = await db.user.findFirst({
          where: { subscriptions: { some: { stripeSubscriptionId: sub.id } } },
        });
        if (!user) break;

        await db.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: "CANCELED" },
        });

        // Kein bezahlter Plan mehr  auf "Free" (null) setzen
        await db.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: user.id },
            data: { plan: null, planRenewsAt: null, planSince: null },
          });
          const prev = await tx.creditBalance.findUnique({ where: { userId: user.id } });
          if (prev) {
            await tx.creditBalance.delete({ where: { userId: user.id } });
          }
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
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = evt.data.object as any;
        const subId = invoice.subscription as string | undefined;
        if (!subId) break;

        // WICHTIG: bei retrieve  "items.data.price" expanden
        const sub = await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price"],
        });
        const customerId = sub.customer as string;
        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (!user) break;

        const priceId = (sub.items?.data?.[0]?.price as { id?: string } | undefined)?.id;
        const plan = planFromPrice(priceId);
        console.log("[webhook]", evt.type, "priceId:", priceId, " plan:", plan);
        if (!plan) break;

        const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000) : new Date();
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : dateFromUnixOrFallback(null);

        await db.subscription.upsert({
          where: { stripeSubscriptionId: sub.id },
          create: {
            userId: user.id,
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId ?? null,
            status: (sub.status as string).toUpperCase() as any,
            currentPeriodEnd: periodEnd,
          },
          update: {
            stripePriceId: priceId ?? null,
            status: (sub.status as string).toUpperCase() as any,
            currentPeriodEnd: periodEnd,
          },
        });

                  // ALLES in einer TX erledigen (periodEnd bereits oben bestimmt)
        await db.$transaction(async (tx) => {
          const oldPlan = (await tx.user.findUnique({ where: { id: user.id }, select: { plan: true } }))?.plan ?? null;
          await carryOverCreditsOnPlanChange(tx, user.id, oldPlan, plan, periodEnd);
          const userUpdate: {
            plan: typeof plan;
            planRenewsAt: Date | null;
            planSince?: Date | null;
          } = {
            plan,
            planRenewsAt: periodEnd,
          };
          if (!oldPlan || oldPlan !== plan) {
            userUpdate.planSince = periodStart;
          }
          await tx.user.update({
            where: { id: user.id },
            data: userUpdate,
          });
          await tx.subscription.upsert({
            where: { stripeSubscriptionId: subId },
            create: {
              userId: user.id,
              stripeSubscriptionId: subId,
              stripePriceId: priceId ?? null,
              status: "ACTIVE",
              currentPeriodEnd: periodEnd,
            },
            update: {
              stripePriceId: priceId ?? null,
              status: "ACTIVE",
              currentPeriodEnd: periodEnd,
            },
          });
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

