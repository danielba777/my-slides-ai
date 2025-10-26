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
      plan: true,
      planRenewsAt: true,
      creditBalance: { select: { credits: true, aiCredits: true, resetsAt: true } },
      subscriptions: {
        select: { status: true, currentPeriodEnd: true, stripeSubscriptionId: true, stripePriceId: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });
  return NextResponse.json({
    plan: user?.plan ?? "STARTER",
    status: user?.subscriptions?.[0]?.status ?? "ACTIVE",
    credits: user?.creditBalance?.credits ?? 0,
    aiCredits: user?.creditBalance?.aiCredits ?? 0,
    resetsAt: user?.creditBalance?.resetsAt ?? user?.planRenewsAt ?? null,
    stripePriceId: user?.subscriptions?.[0]?.stripePriceId ?? null,
    stripeSubscriptionId: user?.subscriptions?.[0]?.stripeSubscriptionId ?? null,
  });
}