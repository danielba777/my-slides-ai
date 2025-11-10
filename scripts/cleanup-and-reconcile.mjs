import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_API_KEY ?? "", { apiVersion: "2025-09-30.clover" });

// Optionales Recompute der Credits (nur wenn du wirklich baseline neu setzen willst)
// Per ENV steuern: RECOMPUTE_CREDITS=1
const RECOMPUTE = process.env.RECOMPUTE_CREDITS === "1";
// Für bekannte Pläne kannst du hier baseline-Werte pflegen:
const PLAN_CREDITS = {
  UNLIMITED: { slides: -1, ai: 1000 },
  // BASIC: { slides: 50, ai: 50 },
  // GROWTH: { slides: 200, ai: 200 },
  // SCALE: { slides: 500, ai: 500 },
};

const DRY = process.env.DRY_RUN === "1";
const CANCEL_DB_OTHERS = true;   // nur DB-Status "CANCELED" setzen (Stripe bleibt unberührt)

function log(...args) { console.log("[cleanup]", ...args); }

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, plan: true, stripeCustomerId: true, planRenewsAt: true }
  });
  log("users:", users.length);

  for (const u of users) {
    // 1) Subscriptions: nur eine "aktive" (oder jüngste) behalten
    const subs = await prisma.subscription.findMany({
      where: { userId: u.id },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });
    if (subs.length > 0) {
      const primary =
        subs.find(s => s.status?.toUpperCase() === "ACTIVE") ??
        subs[0];
      const others = subs.filter(s => s.id !== primary.id);
      log(u.id, "subs:", subs.length, "→ keep", primary.id, "cancel others:", others.map(o => o.id));
      if (!DRY && CANCEL_DB_OTHERS && others.length) {
        await prisma.subscription.updateMany({
          where: { id: { in: others.map(o => o.id) } },
          data: { status: "CANCELED" },
        });
      }
      // planRenewsAt aus Stripe setzen (wenn möglich)
      try {
        if (primary.stripeSubscriptionId) {
          const s = await stripe.subscriptions.retrieve(primary.stripeSubscriptionId);
          const periodEnd = s?.items?.data?.[0]?.current_period_end ?? s?.current_period_end;
          if (periodEnd) {
            const next = new Date(periodEnd * 1000);
            log(u.id, "planRenewsAt ←", next.toISOString());
            if (!DRY) {
              await prisma.user.update({ where: { id: u.id }, data: { planRenewsAt: next } });
            }
          }
        }
      } catch (e) {
        log(u.id, "stripe sub fetch failed:", e?.message ?? e);
      }
    }

    // 2) CreditBalance: nur die jüngste Zeile behalten
    const balances = await prisma.creditBalance.findMany({
      where: { userId: u.id },
      orderBy: { updatedAt: "desc" },
    });
    if (balances.length > 1) {
      const keep = balances[0];
      const dropIds = balances.slice(1).map(b => b.id);
      log(u.id, "creditBalance dupes:", balances.length, "→ keep", keep.id, "delete", dropIds.length);
      if (!DRY && dropIds.length) {
        await prisma.creditBalance.deleteMany({ where: { id: { in: dropIds } } });
      }
    } else if (balances.length === 0) {
      // keine Balance vorhanden → optional anlegen
      const planKey = (u.plan ?? "").toUpperCase();
      const limits = PLAN_CREDITS[planKey];
      if (RECOMPUTE && limits) {
        log(u.id, "create fresh creditBalance with baseline", limits);
        if (!DRY) {
          await prisma.creditBalance.create({
            data: {
              userId: u.id,
              credits: limits.slides,
              aiCredits: limits.ai,
              usedCredits: 0,
              usedAiCredits: 0,
              resetsAt: u.planRenewsAt ?? null,
            },
          });
        }
      } else {
        log(u.id, "no balance found (skip create; next reset/webhook wird sie erstellen)");
      }
    } else {
      // genau 1 Balance vorhanden → optional baseline neu setzen
      const keep = balances[0];
      if (RECOMPUTE) {
        const planKey = (u.plan ?? "").toUpperCase();
        const limits = PLAN_CREDITS[planKey];
        if (limits) {
          log(u.id, "recompute balance", keep.id, "→", limits);
          if (!DRY) {
            await prisma.$transaction([
              prisma.creditBalance.deleteMany({ where: { userId: u.id } }),
              prisma.creditBalance.create({
                data: {
                  userId: u.id,
                  credits: limits.slides,
                  aiCredits: limits.ai,
                  usedCredits: 0,
                  usedAiCredits: 0,
                  resetsAt: u.planRenewsAt ?? null,
                },
              }),
            ]);
          }
        }
      }
    }
  }
  log("done.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});