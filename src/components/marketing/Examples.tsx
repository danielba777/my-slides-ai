"use client";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Section } from "./Section";

type Card = { id: string; views: string; pinned?: boolean };
const cards: Card[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `ex-${i + 1}`,
  views: ["11.9K", "21.2K", "4,456", "155.7K", "215.7K", "49K"][i % 6]!,
  pinned: i < 3,
}));

function PlaceholderSlide() {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-xl border border-border"
      style={{
        background:
          "radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 40%, rgba(0,0,0,0.04) 100%), linear-gradient(180deg, rgba(240,240,240,0.65) 0%, rgba(230,230,230,0.35) 100%)",
      }}
    >
      {}
      <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(0,0,0,.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,.35)_1px,transparent_1px)] [background-size:14px_14px]" />
      {}
      <div className="pointer-events-none absolute -left-1/2 top-0 h-full w-[200%] rotate-[12deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] animate-[sheen_2.8s_ease-in-out_infinite]" />
      {}
      <div className="absolute inset-0 grid place-items-center">
        <div className="rounded-lg bg-black/30 px-2 py-1 text-[10px] font-medium text-white">
          Slide Placeholder
        </div>
      </div>
      <style jsx>{`
        @keyframes sheen {
          0% { transform: translateX(-20%); opacity: 0.0; }
          25% { opacity: 1; }
          50% { transform: translateX(20%); opacity: 0.9; }
          100% { transform: translateX(60%); opacity: 0.0; }
        }
      `}</style>
    </div>
  );
}
export function MarketingExamples() {
  const rows = useMemo(
    () => [cards.slice(0, 6), cards.slice(6, 12)],
    []
  );
  return (
    <Section id="examples">
      <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        Real examples. Real reach.
      </h2>
      <p className="mt-2 text-center text-muted-foreground">
        100% created & published via SlidesCockpit automations.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {rows.flat().map((c) => (
          <div key={c.id}>
            <Card className="relative aspect-[9/16] w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm transition hover:-translate-y-1">
              <PlaceholderSlide />
              {c.pinned && (
                <span className="absolute left-2 top-2 rounded bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Pinned
                </span>
              )}
              <div className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-1 text-xs font-medium text-white">
                {c.views}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </Section>
  );
}
