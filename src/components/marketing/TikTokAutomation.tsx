"use client";

import { Section } from "@/components/marketing/Section";
import Image from "next/image";

const TIKTOK_IMAGES = [
  {
    src: "/slideshow_demo01.webp",
    alt: "Automated TikTok example 1",
    width: 1170,
    height: 1035,
  },
  {
    src: "/slideshow_demo02.webp",
    alt: "Automated TikTok example 2",
    width: 1170,
    height: 1035,
  },
  {
    src: "/slideshow_demo03.webp",
    alt: "Automated TikTok example 3",
    width: 1170,
    height: 1035,
  },
  {
    src: "/slideshow_demo04.webp",
    alt: "Automated TikTok example 4",
    width: 1170,
    height: 1035,
  },
];

export function MarketingTikTokAutomation() {
  return (
    <Section>
      <div className="flex flex-col items-center mx-auto max-w-3xl text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900 leading-tight max-w-sm">
          Wait, it can really automate TikTok Pages?
        </h2>
        <p className="mt-4 text-lg text-zinc-600 font-semibold max-w-[30rem]">
          Yes! The TikToks below were 100% created &amp; published entirely with
          ReelFarm automations
        </p>
      </div>
      <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2">
        {TIKTOK_IMAGES.map((img) => (
          <div
            key={img.src}
            className="overflow-hidden rounded-2xl border border-border bg-muted p-1 shadow-sm"
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              className="h-auto w-full object-contain"
              sizes="(max-width: 768px) 80vw, (max-width: 1200px) 45vw, 25vw"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
