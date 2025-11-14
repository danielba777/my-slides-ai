"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Section } from "./Section";

const testimonials = [
  {
    name: "Liam Brooks",
    handle: "@liamcreates",
    image: "/assets/Testimonial_1.jpg",
    text: "Didn’t expect it to perform this well. Generated 30+ sales in the first week using their slides — insane ROI.",
    rating: 5,
  },
  {
    name: "Ethan Miller",
    handle: "@ethanmkt",
    image: "/assets/Testimonial_2.jpg",
    text: "Super responsive team. They implemented my feedback the same day. That’s how SaaS should be built.",
    rating: 5,
  },
  {
    name: "Sophie Lane",
    handle: "@sophielane.co",
    image: "/assets/Testimonial_3.jpg",
    text: "Finally something that actually saves me time. My content looks way more polished now — love it!",
    rating: 5,
  },
  {
    name: "Noah Reed",
    handle: "@noahreed.ai",
    image: "/assets/Testimonial_4.jpg",
    text: "As a creator, I’ve tried tons of tools — this one just feels effortless. Smart, fast, and designed for real use.",
    rating: 5,
  },
];

export function MarketingTestimonials() {
  return (
    <Section>
      {/* Testimonials Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {testimonials.map((t, i) => (
          <div key={t.name}>
            <Card
              className="
                relative h-full flex flex-col justify-between
                bg-[#EEEFE8] rounded-2xl border border-[#304674]/25
                shadow-sm hover:shadow-lg transition
              "
            >
              <CardContent className="p-6 sm:p-7 flex flex-col h-full">
                {/* Sterne */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-6 w-6 ${
                        idx < t.rating
                          ? "fill-[#FACC26] text-[#FACC26] stroke-none"
                          : "text-gray-300 stroke-gray-300"
                      }`}
                    />
                  ))}
                </div>

                {/* Text */}
                <p className="text-base text-zinc-800 leading-relaxed flex-1 font-medium">
                  {t.text}
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
          </div>
        ))}
      </div>
    </Section>
  );
}
