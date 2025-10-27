import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true, // kann null sein = Free
      planRenewsAt: true,
      stripeCustomerId: true,
      creditBalance: { select: { credits: true, aiCredits: true, resetsAt: true } },
      subscriptions: {
        select: { status: true, currentPeriodEnd: true, stripeSubscriptionId: true, stripePriceId: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  const latestSub = user?.subscriptions?.[0] ?? null;
  const hasPlan = !!user?.plan;
  return NextResponse.json({
    plan: hasPlan ? user!.plan : null,
    status: latestSub?.status ?? null,
    credits: hasPlan ? user?.creditBalance?.credits ?? 0 : null,
    aiCredits: hasPlan ? user?.creditBalance?.aiCredits ?? 0 : null,
    resetsAt: hasPlan ? (user?.creditBalance?.resetsAt ?? user?.planRenewsAt ?? null) : null,
    stripePriceId: latestSub?.stripePriceId ?? null,
    stripeSubscriptionId: latestSub?.stripeSubscriptionId ?? null,
    hasCustomer: !!user?.stripeCustomerId,
    hasSubscription: !!latestSub?.stripeSubscriptionId,
  });
}