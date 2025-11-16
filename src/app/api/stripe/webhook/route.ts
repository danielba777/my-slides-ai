import { NextResponse } from "next/server";
import { stripe } from "@/server/stripe";
import { db } from "@/server/db";
import { planFromPrice, resetAllCredits } from "@/server/billing";
import { carryOverCreditsOnPlanChange } from "@/server/billing";


async function isAlreadyProcessed(eventId: string) {
  const found = await db.processedWebhook.findUnique({ where: { id: eventId } });
  return !!found;
}

async function markProcessed(eventId: string, type: string) {
  await db.processedWebhook.create({ data: { id: eventId, type } });
}

import type Stripe from "stripe";
import { addMonths } from "date-fns";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("No signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    
    switch (event.type) {
      case "invoice.payment_succeeded": {
        
        if (await isAlreadyProcessed(event.id)) {
          console.log(`[webhook] Skipping duplicate event ${event.id}`);
          return new NextResponse("OK", { status: 200 });
        }

        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        const firstLine: any = invoice.lines?.data?.[0] ?? null;
        const priceId: string | null =
          firstLine?.price?.id ??
          (typeof firstLine?.price === "string" ? firstLine.price : null);
        const mappedPlan = planFromPrice(priceId ?? undefined);
        if (!mappedPlan) {
          console.warn("[webhook] ⚠️ invoice.payment_succeeded ohne zuordenbaren Plan", { priceId });
          await markProcessed(event.id, event.type);
          return new NextResponse("OK", { status: 200 });
        }
        const nextResetAt = addMonths(new Date(), 1);

        const user = await db.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });
        
        if (!user?.id) {
          console.warn(`[webhook] ⚠️ Unknown Stripe customer ${customerId}, triggering resync job`);
          fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/billing/sync?customerId=${customerId}`, { method: "POST" })
            .catch((err) => console.error("[webhook] Failed to trigger resync:", err));
          return new NextResponse("OK", { status: 200 });
        }

        await db.$transaction(async (tx) => {
          
          await tx.user.update({
            where: { id: user.id },
            data: {
              plan: mappedPlan,
              planRenewsAt: nextResetAt,
            },
          });

          
          const prevUser = await tx.user.findUnique({
            where: { id: user.id },
            select: { plan: true },
          });
          await carryOverCreditsOnPlanChange(
            tx,
            user.id,
            prevUser?.plan ?? null,
            mappedPlan,
            nextResetAt
          );
        });

        await markProcessed(event.id, event.type);

        return new NextResponse("OK", { status: 200 });
      }

      case "customer.subscription.updated": {
        try {
          const sub = event.data.object as Stripe.Subscription;
          const customerId =
            typeof sub.customer === "string" ? sub.customer : undefined;

          if (!customerId) {
            console.warn("[webhook] ⚠️ subscription.updated ohne customerId");
            return new NextResponse("OK", { status: 200 });
          }

          const user = await db.user.findFirst({
            where: { stripeCustomerId: customerId },
            select: { id: true },
          });
          if (!user?.id) {
            console.warn("[webhook] ⚠️ kein User gefunden zu", customerId);
            return new NextResponse("OK", { status: 200 });
          }

          const firstItem = sub.items?.data?.[0];
          const priceId =
            typeof firstItem?.price === "string"
              ? firstItem.price
              : firstItem?.price?.id ?? null;

          if (!priceId) {
            console.warn("[webhook] ⚠️ kein priceId in subscription.updated");
            return new NextResponse("OK", { status: 200 });
          }

          const mappedPlan = planFromPrice(priceId);
          if (!mappedPlan) {
            console.warn("[webhook] ⚠️ keine Zuordnung für priceId", priceId);
            return new NextResponse("OK", { status: 200 });
          }

          
          const subAny = sub as Stripe.Subscription & { current_period_end?: number };
          const nextPeriodEnd =
            subAny.current_period_end ?? Math.floor(Date.now() / 1000);

          const nextResetAt = new Date(nextPeriodEnd * 1000);
          if (isNaN(nextResetAt.getTime())) {
            console.warn("[webhook] ⚠️ ungültiges Datum:", nextPeriodEnd);
            return new NextResponse("OK", { status: 200 });
          }

          await db.$transaction(async (tx) => {
            await tx.user.update({
              where: { id: user.id },
              data: { plan: mappedPlan, planRenewsAt: nextResetAt },
            });
            await resetAllCredits(tx, user.id, mappedPlan, nextResetAt);
          });

          console.log(
            `[webhook] ✅ subscription.updated OK: plan=${mappedPlan}, renewsAt=${nextResetAt.toISOString()}`
          );
        } catch (err) {
          console.error(
            "[webhook] ❌ subscription.updated – unexpected error:",
            err
          );
        }

        return new NextResponse("OK", { status: 200 });
      }

      default:
        return new NextResponse("OK", { status: 200 });
    }
  } catch (err) {
    console.error("[STRIPE][WEBHOOK] handler error:", {
      eventId: event?.id,
      type: event?.type,
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
    });

    
    if (process.env.SENTRY_DSN) {
      try {
        
        const mod = "@sentry/nextjs";
        const S: any = await import(mod as any);
        S.captureException(err, {
          extra: { eventId: event?.id, type: event?.type },
        });
      } catch {}
    }

    return NextResponse.json({ ok: false, error: "Webhook handler error" }, { status: 500 });
  }
}