import { env } from "@/env";
import type { Plan } from "@prisma/client";

export const PLAN_CREDITS: Record<Plan, { credits: number; ai: number }> = {
  STARTER: { credits: 25, ai: 50 },
  GROWTH: { credits: 100, ai: 150 },
  SCALE: { credits: 250, ai: 300 },
  UNLIMITED: { credits: -1, ai: 1000 },
};

export function planFromPrice(priceId?: string): Plan | undefined {
  if (!priceId) return undefined;
  if (priceId === env.STRIPE_PRICE_STARTER) return "STARTER";
  if (priceId === env.STRIPE_PRICE_GROWTH) return "GROWTH";
  if (priceId === env.STRIPE_PRICE_SCALE) return "SCALE";
  if (priceId === env.STRIPE_PRICE_UNLIMITED) return "UNLIMITED";
  return undefined;
}

export function priceFromPlan(plan: Plan): string | undefined {
  switch (plan) {
    case "STARTER":
      return env.STRIPE_PRICE_STARTER;
    case "GROWTH":
      return env.STRIPE_PRICE_GROWTH;
    case "SCALE":
      return env.STRIPE_PRICE_SCALE;
    case "UNLIMITED":
      return env.STRIPE_PRICE_UNLIMITED;
  }
}

export function percent(used: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / total) * 100)));
}