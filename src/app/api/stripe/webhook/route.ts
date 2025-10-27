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
          console.log("[webhook]", evt.type, "priceId:", priceId, "→ plan:", plan);
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

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = evt.data.object as any;
        const customerId = sub.customer as string;
        const priceId = sub.items?.data?.[0]?.price?.id as string | undefined;
        const plan = planFromPrice(priceId);
        console.log("[webhook]", evt.type, "priceId:", priceId, "→ plan:", plan);
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

        // Credits NICHT hart zurücksetzen – das übernimmt die bezahlte Invoice;
        // hier nur vorbereiten (Plan/Periode).
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
        const subId = invoice.subscription as string | undefined;
        if (!subId) break;

        // WICHTIG: bei retrieve → "items.data.price" expanden
        const sub = await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price"],
        });
        const customerId = sub.customer as string;
        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (!user) break;

        const priceId = (sub.items?.data?.[0]?.price as { id?: string } | undefined)?.id;
        const plan = planFromPrice(priceId);
        console.log("[webhook]", evt.type, "priceId:", priceId, "→ plan:", plan);
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

        // Plan + Perioden sicherstellen (falls dieses Event als erstes kam)
        await db.user.update({
          where: { id: user.id },
          data: { plan, planSince: user.plan ? user.planSince : periodStart, planRenewsAt: periodEnd },
        });

        // Credits für neuen Abrechnungszeitraum setzen
        const pack = PLAN_CREDITS[plan];
        await db.creditBalance.upsert({
          where: { userId: user.id },
          create: { userId: user.id, credits: pack.credits, aiCredits: pack.ai, resetsAt: periodEnd },
          update: { credits: pack.credits, aiCredits: pack.ai, resetsAt: periodEnd },
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