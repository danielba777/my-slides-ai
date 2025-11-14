"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Section } from "./Section";

const tiers = [
  {
    name: "Starter",
    monthlyPrice: "$19",
    yearlyPrice: "$190",
    priceIds: {
      monthly: "price_starter_monthly",
      yearly: "price_starter_yearly",
    },
    features: [
      "25 monthly credits",
      "50 monthly AI credits",
      "Create slideshows",
      "AI avatars",
    ],
  },
  {
    name: "Growth",
    monthlyPrice: "$49",
    yearlyPrice: "$490",
    priceIds: {
      monthly: "price_growth_monthly",
      yearly: "price_growth_yearly",
    },
    features: [
      "100 monthly credits",
      "150 monthly AI credits",
      "Everything from Starter",
      "Priority queue",
    ],
  },
  {
    name: "Scale",
    monthlyPrice: "$95",
    yearlyPrice: "$950",
    priceIds: {
      monthly: "price_scale_monthly",
      yearly: "price_scale_yearly",
    },
    features: [
      "250 monthly credits",
      "300 monthly AI credits",
      "Everything from Growth",
      "Priority support",
    ],
  },
  {
    name: "Unlimited",
    monthlyPrice: "$195",
    yearlyPrice: "$1950",
    priceIds: {
      monthly: "price_unlimited_monthly",
      yearly: "price_unlimited_yearly",
    },
    features: [
      "Unlimited credits",
      "1,000 monthly AI credits",
      "Everything from Scale",
      "White-glove support",
    ],
  },
];

export function MarketingPricing({ session }: { session: boolean }) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
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
    <Section id="pricing">
      <div className="text-center space-y-5 mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900 leading-tight">
          Pricing
        </h2>
      </div>
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white p-1 text-xs shadow-sm">
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            className={`px-3 py-1 rounded-full transition ${
              billingPeriod === "monthly"
                ? "bg-zinc-900 text-white"
                : "text-zinc-700"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("yearly")}
            className={`px-3 py-1 rounded-full transition ${
              billingPeriod === "yearly"
                ? "bg-zinc-900 text-white"
                : "text-zinc-700"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => {
          const isYearly = billingPeriod === "yearly";
          const displayPrice = isYearly ? t.yearlyPrice : t.monthlyPrice;
          const priceLabel = isYearly ? "per year" : "per month";

          return (
            <Card
              key={t.name}
              className="relative flex flex-col justify-between bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden h-full border border-[#304674]/25"
            >
              <CardHeader className="pt-6 pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="text-zinc-900 text-3xl font-bold">
                    {t.name}
                  </span>
                </CardTitle>
                <div className="flex items-end gap-1 mt-1 text-zinc-900">
                  <p className="text-4xl font-bold">{displayPrice}</p>
                  <p className="font-semibold text-sm mb-1">{priceLabel}</p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col justify-between flex-1 pb-6">
                <ul className="mt-2 space-y-2 text-sm text-zinc-700 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-[2px]">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
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
