Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

Begin Patch
Update File: src/components/marketing/Testimonials.tsx

codebase

@@
"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Section } from "./Section";
import { motion } from "framer-motion";
+import { Quote } from "lucide-react";

export function MarketingTestimonials() {
return (

- <Section>
-      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">

* <Section>
*      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
           {[
             {
               name: "Andrew (@drewecom)",
               text:
                 "Helped me make $96k in profit last month on TikTok shop. Shoutout to the team.",
  @@
  {
  name: "Jordan Cole (@jordancoleNA)",
  text:

-              "Not affiliated other than being a customer: one of the coolest AI marketing tools recently.",

*              "Not affiliated other than being a customer: one of the coolest AI marketing tools recently.",
           },
         ].map((t, i) => (
           <motion.div
             key={t.name}
             initial={{ opacity: 0, y: 10 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: i * 0.05, duration: 0.35 }}
           >

-            <Card className="shadow-sm">
-              <CardContent className="p-5">
-                <div className="text-sm text-muted-foreground">{t.name}</div>
-                <p className="mt-2 text-[15px] leading-relaxed">{t.text}</p>
-              </CardContent>
-            </Card>

*            <Card
*              className="
*                relative overflow-hidden shadow-sm
*                rounded-2xl border border-border/40
*                bg-neutral-950 text-white
*              "
*            >
*              {/* subtile Akzentkante oben – wie im Hero */}
*              <div className="absolute inset-x-0 top-0 h-1 bg-[#304674]/60" />
*              <CardContent className="p-5 sm:p-6">
*                <div className="flex items-start gap-3">
*                  <div className="mt-0.5 shrink-0 rounded-full bg-white/10 p-2 ring-1 ring-white/10">
*                    <Quote className="h-4 w-4 text-white/80" />
*                  </div>
*                  <div>
*                    <p className="text-[15px] leading-relaxed text-white/90">
*                      {t.text}
*                    </p>
*                    <div className="mt-3 text-xs font-medium tracking-wide text-white/60">
*                      {t.name}
*                    </div>
*                  </div>
*                </div>
*              </CardContent>
*            </Card>
            </motion.div>
          ))}
        </div>
      </Section>
  );
  }

Update File: src/components/marketing/Pricing.tsx

codebase

@@
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section } from "./Section";
-import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
+import { Check } from "lucide-react";

@@
-export function MarketingPricing({ session }: { session: boolean }) {
+export function MarketingPricing({ session }: { session: boolean }) {
return (

- <Section id="pricing">
-      <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
-        Preise
-      </h2>
-      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

* <Section id="pricing">
*      <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
*        Preise
*      </h2>
*      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
         {tiers.map((t) => (
           <Card
             key={t.name}

-            className={`${t.highlight ? "relative border-primary/30 shadow-lg" : ""} overflow-hidden`}

*            className={[
*              "relative overflow-hidden rounded-2xl",
*              // dunkle, hero-nahe Kartenoptik
*              "bg-neutral-950 text-white",
*              "border border-border/40",
*              t.highlight ? "ring-1 ring-[#304674]/40 shadow-lg" : "shadow-sm",
*            ].join(" ")}
           >

-            {t.highlight && (
-              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#304674] via-[#304674] to-[#304674]" />
-            )}
-            <CardHeader>
-              <CardTitle className="flex items-center justify-between text-base">
-                <span className="text-foreground">{t.name}</span>
-                {t.badge && <Badge variant="secondary">{t.badge}</Badge>}
-              </CardTitle>
-              <div className="mt-1 text-3xl font-semibold">{t.price}</div>
-            </CardHeader>
-            <CardContent>
-              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
-                {t.features.map((f) => (
-                  <li key={f}>• {f}</li>
-                ))}
-              </ul>
-              <div className="mt-6">
-                {session ? (
-                  <Link href="/dashboard/home">
-                    <Button
-                      className={`w-full rounded-full ${t.highlight ? "bg-[#304674] text-white hover:opacity-90" : ""}`}
-                      data-price={t.priceId}
-                    >
-                      {t.highlight ? "Mit Growth starten" : "Plan wählen"}
-                    </Button>
-                  </Link>
-                ) : (
-                  <Link href="/auth/signin?callbackUrl=/dashboard/home">
-                    <Button
-                      className={`w-full rounded-full ${t.highlight ? "bg-[#304674] text-white hover:opacity-90" : ""}`}
-                      data-price={t.priceId}
-                    >
-                      {t.highlight ? "Mit Growth starten" : "Plan wählen"}
-                    </Button>
-                  </Link>
-                )}
-              </div>
-            </CardContent>

*            {/* subtile Akzentkante wie im Hero */}
*            <div className="absolute inset-x-0 top-0 h-1 bg-[#304674]/60" />
*            <CardHeader className="pt-5 sm:pt-6">
*              <CardTitle className="flex items-center justify-between text-base">
*                <span className="text-white/90">{t.name}</span>
*                {t.badge && (
*                  <Badge className="bg-white/10 text-white hover:bg-white/20">
*                    {t.badge}
*                  </Badge>
*                )}
*              </CardTitle>
*              <div className="mt-1 text-3xl font-semibold">{t.price}</div>
*            </CardHeader>
*            <CardContent className="pb-6 sm:pb-7">
*              <ul className="mt-2 space-y-2.5 text-sm text-white/80">
*                {t.features.map((f) => (
*                  <li key={f} className="flex items-start gap-2.5">
*                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
*                      <Check className="h-3.5 w-3.5 text-white/90" />
*                    </span>
*                    <span className="leading-relaxed">{f}</span>
*                  </li>
*                ))}
*              </ul>
*              <div className="mt-6">
*                {session ? (
*                  <Link href="/dashboard/home">
*                    <Button
*                      className={[
*                        "w-full rounded-full transition",
*                        t.highlight
*                          ? "bg-[#304674] text-white hover:opacity-90"
*                          : "bg-white text-neutral-900 hover:bg-white/90",
*                      ].join(" ")}
*                      data-price={t.priceId}
*                    >
*                      {t.highlight ? "Mit Growth starten" : "Plan wählen"}
*                    </Button>
*                  </Link>
*                ) : (
*                  <Link href="/auth/signin?callbackUrl=/dashboard/home">
*                    <Button
*                      className={[
*                        "w-full rounded-full transition",
*                        t.highlight
*                          ? "bg-[#304674] text-white hover:opacity-90"
*                          : "bg-white text-neutral-900 hover:bg-white/90",
*                      ].join(" ")}
*                      data-price={t.priceId}
*                    >
*                      {t.highlight ? "Mit Growth starten" : "Plan wählen"}
*                    </Button>
*                  </Link>
*                )}
*              </div>
*            </CardContent>
            </Card>
          ))}
        </div>
      </Section>
  );
  }

End Patch
