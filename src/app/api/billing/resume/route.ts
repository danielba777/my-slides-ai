import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { stripe } from "@/server/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const sub = await db.subscription.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  if (!sub?.stripeSubscriptionId) return new NextResponse("No subscription", { status: 400 });

  await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: false });
  return NextResponse.json({ ok: true });
}