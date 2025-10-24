"use client";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Section } from "./Section";

const testimonials = [
  {
    name: "Andrew",
    handle: "@drewecom",
    image: "/images/testimonials/andrew.jpg",
    text: "Helped me make $96k in profit last month on TikTok shop. Shoutout to the team.",
    rating: 5,
  },
  {
    name: "Quinn",
    handle: "@quinnslcm",
    image: "/images/testimonials/quinn.jpg",
    text: "Support replied within minutes, fixed and shipped an update in under an hour. Incredible.",
    rating: 5,
  },
  {
    name: "Gabe",
    handle: "@gabe__perez",
    image: "/images/testimonials/gabe.jpg",
    text: "I've seen a lot of AI UGC tools but this one feels the best. Also probably the OG.",
    rating: 4,
  },
  {
    name: "Jordan Cole",
    handle: "@jordancoleNA",
    image: "/images/testimonials/jordan.jpg",
    text: "Not affiliated other than being a customer: one of the coolest AI marketing tools recently.",
    rating: 5,
  },
];

export function MarketingTestimonials() {
  return (
    <Section>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center space-y-6 mb-8"
      >
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
          Was unsere Nutzer sagen
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Echte Stimmen von Creators, die mit{" "}
          <span className="font-bold text-[#304674]">SlidesCockpit</span>{" "}
          arbeiten.
        </p>
      </motion.div>

      {/* Testimonials Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            viewport={{ once: true }}
          >
            <Card
              className="
                relative h-full flex flex-col justify-between
                bg-white rounded-2xl border border-[#304674]/25
                shadow-md hover:shadow-lg transition
              "
            >
              <CardContent className="p-6 sm:p-7 flex flex-col h-full">
                {/* Sterne */}
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${
                        idx < t.rating
                          ? "fill-[#304674] text-[#304674]"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>

                {/* Text */}
                <p className="text-[15px] text-muted-foreground leading-relaxed flex-1">
                  "{t.text}"
                </p>

                {/* Person */}
                <div className="flex items-center gap-4 mt-6">
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-[#304674]/30">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-foreground">
                      {t.name}
                    </div>
                    <div className="text-sm text-[#304674]/90">{t.handle}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
