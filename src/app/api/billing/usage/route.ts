import { auth } from "@/server/auth";
import { normalizeCreditBalance } from "@/server/billing";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ success: false }, { status: 400 });
    revalidateTag(`usage-${userId}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { user, balance } = await db.$transaction(async (tx) => {
    const [userRecord, bal] = await Promise.all([
      tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          plan: true,
          planRenewsAt: true,
          stripeCustomerId: true,
          subscriptions: {
            select: {
              status: true,
              currentPeriodEnd: true,
              stripeSubscriptionId: true,
              stripePriceId: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      }),
      normalizeCreditBalance(tx, session.user.id),
    ]);
    return { user: userRecord, balance: bal };
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  const latestSub = user?.subscriptions?.[0] ?? null;
  const hasPlan = !!user?.plan;
  const freeCredits = !hasPlan ? (balance?.credits ?? 5) : null;
  const freeAi = !hasPlan ? (balance?.aiCredits ?? 0) : null;
  const freeUsedCredits = !hasPlan ? (balance?.usedCredits ?? 0) : null;
  const freeUsedAi = !hasPlan ? (balance?.usedAiCredits ?? 0) : null;
  const payload = {
    plan: hasPlan ? user.plan : null,
    status: latestSub?.status ?? null,
    credits: hasPlan ? (balance?.credits ?? 0) : freeCredits,
    aiCredits: hasPlan ? (balance?.aiCredits ?? 0) : freeAi,
    usedCredits: hasPlan ? (balance?.usedCredits ?? 0) : freeUsedCredits,
    usedAiCredits: hasPlan ? (balance?.usedAiCredits ?? 0) : freeUsedAi,
    resetsAt: hasPlan
      ? (balance?.resetsAt ?? user?.planRenewsAt ?? null)
      : null,
    stripePriceId: latestSub?.stripePriceId ?? null,
    stripeSubscriptionId: latestSub?.stripeSubscriptionId ?? null,
    hasCustomer: !!user?.stripeCustomerId,
    hasSubscription: !!latestSub?.stripeSubscriptionId,
  };
  return NextResponse.json(payload);
}
