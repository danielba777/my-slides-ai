"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import Link from "next/link";
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
      "Hook + demo videos",
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
      "Bulk creation",
      "Priority queue",
    ],
  },
  {
    name: "Scale",
    price: "€95",
    features: [
      "250 monthly credits",
      "300 monthly AI credits",
      "10 TikTok automations",
      "Team access",
    ],
  },
  {
    name: "Unlimited",
    price: "€195",
    badge: "Premium",
    features: [
      "Unlimited credits",
      "1,000 monthly AI credits",
      "Unlimited automations",
      "White-glove support",
    ],
  },
];

export function MarketingPricing({ session }: { session: boolean }) {
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
                <Link
                  href={
                    session
                      ? "/dashboard/home"
                      : "/auth/signin?callbackUrl=/dashboard/home"
                  }
                >
                  <Button
                    className={`w-full rounded-full text-sm font-medium transition ${
                      t.highlight
                        ? "bg-[#304674] text-white hover:opacity-90"
                        : "bg-[#f5f6fa] text-[#304674] hover:bg-[#e8eefc]"
                    }`}
                    data-price={t.priceId}
                  >
                    {t.highlight ? "Start with Growth" : "Choose plan"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </Section>
  );
}
