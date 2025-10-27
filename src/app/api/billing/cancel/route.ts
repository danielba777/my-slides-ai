import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { stripe } from "@/server/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const sub = await db.subscription.findFirst({
    where: { userId: session.user.id, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
    orderBy: { updatedAt: "desc" },
  });
  if (!sub?.stripeSubscriptionId) return new NextResponse("No active subscription", { status: 400 });

  await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
  return NextResponse.json({ ok: true });
}