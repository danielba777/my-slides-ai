import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { normalizeCreditBalance } from "@/server/billing";

import { revalidateTag } from "next/cache";

// ✅ New route for triggering live updates (called from server)
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
  console.debug("[api][billing/usage] session", { userId: session.user.id });
  const { user, balance } = await db.$transaction(async (tx) => {
    const [userRecord, bal] = await Promise.all([
      tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          plan: true, // kann null sein = Free
          planRenewsAt: true,
          stripeCustomerId: true,
          subscriptions: {
            select: { status: true, currentPeriodEnd: true, stripeSubscriptionId: true, stripePriceId: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      }),
      normalizeCreditBalance(tx, session.user.id),
    ]);
    console.debug("[api][billing/usage] tx result", { userId: session.user.id, hasUser: !!userRecord, balance: bal });
    return { user: userRecord, balance: bal };
  });

  if (!user) {
    console.warn("[api][billing/usage] user missing", { userId: session.user?.id });
    return new NextResponse("User not found", { status: 404 });
  }

  const latestSub = user?.subscriptions?.[0] ?? null;
  const hasPlan = !!user?.plan;
  console.debug("[api][billing/usage] computed", { userId: session.user.id, hasPlan, plan: user.plan, latestStatus: latestSub?.status, balance });
  // Bei Free-Plan keine "0 left"-Falle durch alte Balance:
  // Falls kein Plan und keine Balance vorhanden -> 5/0 zurueckgeben (UI zeigt dann korrekt 0/5 verwendet)
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
    resetsAt: hasPlan ? (balance?.resetsAt ?? user?.planRenewsAt ?? null) : null,
    stripePriceId: latestSub?.stripePriceId ?? null,
    stripeSubscriptionId: latestSub?.stripeSubscriptionId ?? null,
    hasCustomer: !!user?.stripeCustomerId,
    hasSubscription: !!latestSub?.stripeSubscriptionId,
  };
  console.debug("[api][billing/usage] response", { userId: session.user.id, payload });
  return NextResponse.json(payload);
}

