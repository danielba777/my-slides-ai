"use client";

import { Section } from "@/components/marketing/Section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// PlanButton component for the pricing cards
function PlanButton({
  plan,
  session,
  variant = "default",
  label,
}: {
  plan: string;
  session?: boolean;
  variant?: "default" | "primary";
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const PLAN_MAP: Record<string, "STARTER" | "GROWTH" | "SCALE" | "UNLIMITED"> =
    {
      starter: "STARTER",
      growth: "GROWTH",
      scale: "SCALE",
      unlimited: "UNLIMITED",
    };

  async function startCheckout() {
    const serverPlan = PLAN_MAP[plan];
    if (!serverPlan) return;

    if (!session) {
      router.push(`/auth/signin?callbackUrl=/checkout?plan=${serverPlan}`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: serverPlan }),
      });

      let data: any = null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      } else {
        const text = await res.text().catch(() => "");
        console.error("Checkout non-JSON response:", text);
      }

      if (!res.ok || !data?.url) {
        console.error("Checkout error", { status: res.status, data });
        toast.error(
          data?.error
            ? `Checkout failed: ${data.error}`
            : `Checkout failed (${res.status}). Please try again.`,
        );
        return;
      }
      window.location.href = data.url as string;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      className={`w-full rounded-lg px-4 py-2 font-medium transition ${
        variant === "primary"
          ? "bg-[#304674] text-white hover:opacity-90"
          : "bg-[#f5f6fa] text-[#304674] hover:bg-[#e8eefc]"
      } disabled:opacity-50`}
    >
      {loading ? "Redirecting…" : label || "Choose plan"}
    </button>
  );
}

const tiers = [
  {
    name: "Starter",
    monthlyPrice: "$19",
    yearlyPrice: "$15",
    billedAnnually: "$180",
    priceIds: {
      monthly: "price_starter_monthly",
      yearly: "price_starter_yearly",
    },
    features: [
      "25 monthly credits",
      "50 monthly AI credits",
      "Create slideshows",
      "Create hook + demo videos",
    ],
  },
  {
    name: "Growth",
    monthlyPrice: "$49",
    yearlyPrice: "$39",
    billedAnnually: "$468",
    priceIds: {
      monthly: "price_growth_monthly",
      yearly: "price_growth_yearly",
    },
    features: [
      "100 monthly credits",
      "150 monthly AI credits",
      "3 TikTok automations",
      "Schedule posts",
      "Add unlimited TikTok accounts",
      "Add unlimited team members",
    ],
  },
  {
    name: "Scale",
    monthlyPrice: "$95",
    yearlyPrice: "$79",
    billedAnnually: "$948",
    priceIds: {
      monthly: "price_scale_monthly",
      yearly: "price_scale_yearly",
    },
    features: [
      "250 monthly credits",
      "300 monthly AI credits",
      "10 TikTok automations",
    ],
  },
  {
    name: "Unlimited",
    monthlyPrice: "$195",
    yearlyPrice: "$149",
    billedAnnually: "$1,788",
    priceIds: {
      monthly: "price_unlimited_monthly",
      yearly: "price_unlimited_yearly",
    },
    features: [
      "Unlimited monthly credits",
      "1,000 monthly AI credits",
      "Unlimited automations",
      "...everything from Scale tier",
    ],
  },
];

export function MarketingPricing({
  session,
  compact = false,
}: {
  session: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "yearly",
  );

  // Mapping der sichtbaren Namen zu den Server-Plan-Keys
  const PLAN_MAP: Record<string, "STARTER" | "GROWTH" | "SCALE" | "UNLIMITED"> =
    {
      Starter: "STARTER",
      Growth: "GROWTH",
      Scale: "SCALE",
      Unlimited: "UNLIMITED",
    };

  async function startCheckout(name: string, period: "monthly" | "yearly") {
    // Wenn nicht eingeloggt → zur Sign-in-Seite mit Rücksprung zu gewünschtem Plan
    const plan = PLAN_MAP[name];
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/checkout?plan=${plan}`);
      return;
    }
    if (!plan) return;
    try {
      setLoadingPlan(plan);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval: period }),
      });

      // Robust gegen Non-JSON / leeren Body
      let data: any = null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          // JSON kaputt/leer
          data = null;
        }
      } else {
        // Fallback: Text lesen für Logging
        const text = await res.text().catch(() => "");
        console.error("Checkout non-JSON response:", text);
      }

      if (!res.ok || !data?.url) {
        console.error("Checkout error", { status: res.status, data });
        toast.error(
          data?.error
            ? `Checkout failed: ${data.error}`
            : `Checkout failed (${res.status}). Please try again.`,
        );
        return;
      }
      window.location.href = data.url as string;
    } finally {
      setLoadingPlan(null);
    }
  }
  return (
    <Section
      id="pricing"
      className={compact ? "py-0" : undefined}
      container={!compact}
    >
      <div className={`text-center space-y-5 ${compact ? "mb-4" : "mb-8"}`}>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900 leading-tight">
          Pricing
        </h2>
      </div>
      <div className={`flex justify-center ${compact ? "mb-4" : "mb-6"}`}>
        <Tabs
          value={billingPeriod}
          onValueChange={(val) => setBillingPeriod(val as "monthly" | "yearly")}
          className={compact ? "w-full" : "w-full max-w-xs"}
        >
          <TabsList className="grid grid-cols-2 h-11 rounded-full bg-white border border-[#304674]/25 p-1">
            <TabsTrigger
              value="monthly"
              className="h-full flex items-center justify-center rounded-full text-sm font-medium
                   data-[state=active]:bg-[#2A8AEC]
                   data-[state=active]:text-white
                   data-[state=active]:shadow-none"
            >
              Monthly
            </TabsTrigger>

            <TabsTrigger
              value="yearly"
              className="h-full flex items-center justify-center rounded-full text-sm font-medium
                   data-[state=active]:bg-[#2A8AEC]
                   data-[state=active]:text-white
                   data-[state=active]:shadow-none"
            >
              Yearly
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div
        className={`grid gap-4 ${
          compact ? "mt-4" : "mt-8"
        } sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`}
      >
        {tiers.map((t) => {
          const isYearly = billingPeriod === "yearly";
          const displayPrice = isYearly ? t.yearlyPrice : t.monthlyPrice;
          const priceLabel = "per month";

          return (
            <Card
              key={t.name}
              className="relative flex flex-col justify-between bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden h-full border border-[#304674]/25"
            >
              <CardHeader className="pt-6 pb-3 pl-4 pr-0">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="text-zinc-900 text-3xl font-bold">
                    {t.name}
                  </span>
                </CardTitle>
                <div className="mt-1 text-zinc-900 flex flex-col gap-0.5">
                  <div className="flex items-end gap-1">
                    <p className="text-5xl font-bold">{displayPrice}</p>
                    <div className="flex flex-col space-y-0 leading-tight mb-1">
                      {isYearly && (
                        <p className="text-xs font-medium text-zinc-500">
                          billed annually {t.billedAnnually}
                        </p>
                      )}
                      <p className="font-bold text-xs">{priceLabel}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col justify-between flex-1 pb-6 pl-5 pr-0">
                <ul className="mt-2 space-y-2 text-sm text-zinc-700 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2
                        className="mt-[2px] h-4 w-4 text-[#2A8AEC]"
                        aria-hidden="true"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pr-5">
                  <Button
                    onClick={() => startCheckout(t.name, billingPeriod)}
                    disabled={loadingPlan !== null}
                    className="w-full rounded-full text-sm font-medium transition bg-[#2A8AEC] text-white hover:bg-[#1f74c3]"
                    data-price={t.priceIds[billingPeriod]}
                  >
                    {loadingPlan === PLAN_MAP[t.name]
                      ? "Redirecting…"
                      : "Subscribe"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
