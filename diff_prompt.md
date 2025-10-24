Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

✅ Diff – src/components/marketing/Pricing.tsx
@@
export function MarketingPricing({ session }: { session: boolean }) {
return (

<Section id="pricing">

-      <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
-        Preise
-      </h2>
-      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
-        {tiers.map((t) => (
-          <Card
-            key={t.name}
-            className={`${t.highlight ? "relative border-primary/30 shadow-lg" : ""} overflow-hidden`}
-          >
-            {t.highlight && (
-              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#304674] via-[#304674] to-[#304674]" />
-            )}
-            <CardHeader>
-              <CardTitle className="flex items-center justify-between text-base">
-                <span className="text-foreground">{t.name}</span>
-                {t.badge && (
-                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-[#c2d5ff] rounded-full text-sm font-medium text-indigo-700">
-                    {t.badge}
-                  </div>
-                )}
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
-          </Card>
-        ))}
-      </div>
- </Section>

*      <div className="text-center mb-10">
*        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
*          Preise
*        </h2>
*        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
*          Wähle den Plan, der zu deinem Wachstum passt.
*        </p>
*      </div>
*
*      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
*        {tiers.map((t) => (
*          <Card
*            key={t.name}
*            className={`
*              relative flex flex-col justify-between
*              bg-white rounded-2xl border border-[#304674]/25
*              shadow-md hover:shadow-lg transition
*              overflow-hidden h-full
*              ${t.highlight ? "ring-1 ring-[#304674]/40" : ""}
*            `}
*          >
*            {/* Akzentlinie */}
*            <div className="absolute inset-x-0 top-0 h-[3px] bg-[#304674]" />
*
*            <CardHeader className="pt-6 pb-3">
*              <CardTitle className="flex items-center justify-between text-base">
*                <span className="text-foreground font-semibold">{t.name}</span>
*                {t.badge && (
*                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e8eefc] rounded-full text-sm font-medium text-[#304674]">
*                    {t.badge}
*                  </div>
*                )}
*              </CardTitle>
*              <div className="mt-1 text-3xl font-semibold text-[#304674]">
*                {t.price}
*              </div>
*            </CardHeader>
*
*            <CardContent className="flex flex-col justify-between flex-1 pb-6">
*              <ul className="mt-2 space-y-2 text-sm text-muted-foreground flex-1">
*                {t.features.map((f) => (
*                  <li key={f} className="flex items-start gap-2">
*                    <span className="text-[#304674] mt-[2px]">•</span>
*                    <span>{f}</span>
*                  </li>
*                ))}
*              </ul>
*
*              <div className="mt-8">
*                <Link
*                  href={
*                    session
*                      ? "/dashboard/home"
*                      : "/auth/signin?callbackUrl=/dashboard/home"
*                  }
*                >
*                  <Button
*                    className={`w-full rounded-full text-sm font-medium transition ${
*                      t.highlight
*                        ? "bg-[#304674] text-white hover:opacity-90"
*                        : "bg-[#f5f6fa] text-[#304674] hover:bg-[#e8eefc]"
*                    }`}
*                    data-price={t.priceId}
*                  >
*                    {t.highlight ? "Mit Growth starten" : "Plan wählen"}
*                  </Button>
*                </Link>
*              </div>
*            </CardContent>
*          </Card>
*        ))}
*      </div>
* </Section>
