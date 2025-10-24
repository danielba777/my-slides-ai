"use client";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Section } from "./Section";
import { CheckCircle2, Wand2, Timer, Rocket } from "lucide-react";

export function MarketingSocialProof() {
  const items = [
    {
      icon: Timer,
      title: "Idea → Post in under 10 minutes",
      desc:
        "Templates, auto-captioning & exports that just work. Stop fussing, start publishing.",
    },
    {
      icon: Wand2,
      title: "Slides that don't feel like AI",
      desc:
        "On-brand fonts & layouts, precision controls, background/outline & spacing that match TikTok.",
    },
    {
      icon: Rocket,
      title: "Schedule & auto-publish",
      desc:
        "Queue your next week in minutes. One click from draft to TikTok-ready post.",
    },
  ] as const;

  return (
    <Section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
          >
            <Card className="h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <it.icon className="h-5 w-5 text-foreground" />
                  <h3 className="text-base font-semibold leading-tight">
                    {it.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {it.desc}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
