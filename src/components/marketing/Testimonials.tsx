"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Section } from "./Section";
import { motion } from "framer-motion";

export function MarketingTestimonials() {
  return (
    <Section>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {[
          {
            name: "Andrew (@drewecom)",
            text:
              "Helped me make $96k in profit last month on TikTok shop. Shoutout to the team.",
          },
          {
            name: "Quinn (@quinnslcm)",
            text:
              "Support replied within minutes, fixed and shipped an update in under an hour. Incredible.",
          },
          {
            name: "Gabe (@gabe__perez)",
            text:
              "I've seen a lot of AI UGC tools but this one feels the best. Also probably the OG.",
          },
          {
            name: "Jordan Cole (@jordancoleNA)",
            text:
              "Not affiliated other than being a customer: one of the coolest AI marketing tools recently.",
          },
        ].map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
          >
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">{t.name}</div>
                <p className="mt-2 text-[15px] leading-relaxed">{t.text}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}