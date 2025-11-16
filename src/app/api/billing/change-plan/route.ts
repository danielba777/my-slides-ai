import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { stripe } from "@/server/stripe";
import { planFromPrice } from "@/server/billing";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { priceId } = await req.json();
  if (!priceId) return new NextResponse("Missing priceId", { status: 400 });

  const sub = await db.subscription.findFirst({
    where: { userId: session.user.id, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
    orderBy: { updatedAt: "desc" },
  });
  if (!sub?.stripeSubscriptionId) return new NextResponse("No active subscription", { status: 400 });

  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  const itemId = stripeSub.items.data[0]?.id;
  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: "create_prorations",
  });

  return NextResponse.json({ ok: true, newPlan: planFromPrice(priceId) });
}