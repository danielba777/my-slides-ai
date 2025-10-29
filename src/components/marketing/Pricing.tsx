"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Section } from "./Section";

const tiers = [
  {
    name: "Starter",
    price: "€19",
    priceId: "price_starter",
    features: [
      "25 monthly credits",
      "50 monthly AI credits",
      "Create slideshows",
      "AI avatars",
    ],
  },
  {
    name: "Growth",
    price: "€49",
    highlight: true,
    badge: "Most popular",
    features: [
      "100 monthly credits",
      "150 monthly AI credits",
      "Everything from Starter",
      "Priority queue",
    ],
  },
  {
    name: "Scale",
    price: "€95",
    features: [
      "250 monthly credits",
      "300 monthly AI credits",
      "Everything from Growth",
      "Priority support",
    ],
  },
  {
    name: "Unlimited",
    price: "€195",
    badge: "Premium",
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

  // Mapping der sichtbaren Namen zu den Server-Plan-Keys
  const PLAN_MAP: Record<string, "STARTER" | "GROWTH" | "SCALE" | "UNLIMITED"> =
    {
      Starter: "STARTER",
      Growth: "GROWTH",
      Scale: "SCALE",
      Unlimited: "UNLIMITED",
    };

  async function startCheckout(name: string) {
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
        body: JSON.stringify({ plan }),
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center space-y-5 mb-8"
      >
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
          Pricing
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Pick the plan that matches your next growth stage.
        </p>
      </motion.div>
      <motion.div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => (
          <Card
            key={t.name}
            className={`
              relative flex flex-col justify-between
              bg-white rounded-2xl border border-[#304674]/25
              shadow-md hover:shadow-lg transition
              overflow-hidden h-full
              ${t.highlight ? "ring-1 ring-[#304674]/40" : ""}
            `}
          >
            {/* Akzentlinie */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-[#304674]" />
            <CardHeader className="pt-6 pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="text-[#304674] text-xl font-bold">
                  {t.name}
                </span>
                {t.badge && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e8eefc] rounded-full text-sm font-medium text-[#304674]">
                    {t.badge}
                  </div>
                )}
              </CardTitle>
              <div className="mt-1 text-3xl font-semibold text-[#304674]">
                {t.price}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1 pb-6">
              <ul className="mt-2 space-y-2 text-sm text-gray-700 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-[2px]">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  onClick={() => startCheckout(t.name)}
                  disabled={loadingPlan !== null}
                  className={`w-full rounded-full text-sm font-medium transition ${
                    t.highlight
                      ? "bg-[#304674] text-white hover:opacity-90"
                      : "bg-[#f5f6fa] text-[#304674] hover:bg-[#e8eefc]"
                  }`}
                  data-price={t.priceId}
                >
                  {loadingPlan === PLAN_MAP[t.name]
                    ? "Redirecting…"
                    : t.highlight
                      ? "Start with Growth"
                      : "Choose plan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </Section>
  );
}
