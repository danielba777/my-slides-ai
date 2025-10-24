"use client";
import { Section } from "./Section";

const logos = ["moz", "glz", "finch", "tripbf", "topaz"] as const;

export function MarketingLogos() {
  return (
    <Section className="py-8 sm:py-12">
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Trusted by ambitious creators and teams
      </p>
      <div className="grid grid-cols-3 place-items-center gap-4 sm:grid-cols-5">
        {logos.map((l) => (
          <div
            key={l}
            className="grid h-8 w-full max-w-[120px] place-items-center rounded-md border border-dashed border-muted-foreground/30 text-xs text-muted-foreground contrast-125 grayscale hover:grayscale-0 transition"
            aria-label={`${l} logo`}
          >
            {l}
          </div>
        ))}
      </div>
    </Section>
  );
}