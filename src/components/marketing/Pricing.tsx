"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section } from "./Section";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const tiers = [
  {
    name: "Starter",
    price: "€19",
    priceId: "price_starter",
    features: [
      "25 monatliche Credits",
      "50 monatliche KI-Credits",
      "Erstelle Slideshows",
      "Hook + Demo-Videos",
    ],
  },
  {
    name: "Growth",
    price: "€49",
    highlight: true,
    badge: "Beliebtester",
    features: [
      "100 monatliche Credits",
      "150 monatliche KI-Credits",
      "Massen-Erstellung",
      "Prioritäts-Warteschlange",
    ],
  },
  {
    name: "Scale",
    price: "€95",
    features: [
      "250 monatliche Credits",
      "300 monatliche KI-Credits",
      "10 TikTok-Automatisierungen",
      "Team-Zugang",
    ],
  },
  {
    name: "Unlimited",
    price: "€195",
    badge: "Premium",
    features: [
      "Unbegrenzte Credits",
      "1000 monatliche KI-Credits",
      "Unbegrenzte Automatisierungen",
      "Weiße-Hand-Unterstützung",
    ],
  },
];

export function MarketingPricing({ session }: { session: boolean }) {
  return (
    <Section id="pricing">
      <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        Preise
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => (
          <Card
            key={t.name}
            className={`${t.highlight ? "relative border-primary/30 shadow-lg" : ""} overflow-hidden`}
          >
            {t.highlight && (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#304674] via-[#304674] to-[#304674]" />
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="text-foreground">{t.name}</span>
                {t.badge && <Badge variant="secondary">{t.badge}</Badge>}
              </CardTitle>
              <div className="mt-1 text-3xl font-semibold">{t.price}</div>
            </CardHeader>
            <CardContent>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {t.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <div className="mt-6">
                {session ? (
                  <Link href="/dashboard/home">
                    <Button
                      className={`w-full rounded-full ${t.highlight ? "bg-[#304674] text-white hover:opacity-90" : ""}`}
                      data-price={t.priceId}
                    >
                      {t.highlight ? "Mit Growth starten" : "Plan wählen"}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signin?callbackUrl=/dashboard/home">
                    <Button
                      className={`w-full rounded-full ${t.highlight ? "bg-[#304674] text-white hover:opacity-90" : ""}`}
                      data-price={t.priceId}
                    >
                      {t.highlight ? "Mit Growth starten" : "Plan wählen"}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}
