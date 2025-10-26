type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalPageContentProps = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export function LegalPageContent({
  title,
  description,
  lastUpdated,
  sections,
}: LegalPageContentProps) {
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-16 sm:py-24">
      <div className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Last updated {lastUpdated}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <p className="text-base text-muted-foreground">{description}</p>
      </div>

      <div className="mt-12 space-y-6">
        {sections.map((section) => (
          <article
            key={section.title}
            className="space-y-4 rounded-2xl border border-border/60 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-white/10 dark:bg-slate-900/60"
          >
            <h2 className="text-xl font-semibold text-slate-900">
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-slate-600">
                {paragraph}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-dashed border-border/70 bg-white/60 p-6 text-sm text-muted-foreground dark:bg-slate-900/40">
        Dies ist ein Platzhalter für die finalen Rechtstexte. Ersetze die
        Abschnittsinhalte, sobald die final geprüften Versionen verfügbar sind.
      </div>
    </section>
  );
}
