"use client";

import { Section } from "@/components/marketing/Section";
import Image from "next/image";
import { useRef, useState, type TouchEvent } from "react";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const showPrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? TIKTOK_IMAGES.length - 1 : prev - 1,
    );
  };

  const showNext = () => {
    setActiveIndex((prev) =>
      prev === TIKTOK_IMAGES.length - 1 ? 0 : prev + 1,
    );
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartX.current;
    if (start === null) return;
    const end = event.changedTouches[0]?.clientX ?? start;
    const delta = end - start;
    if (Math.abs(delta) > 40) {
      if (delta < 0) showNext();
      else showPrev();
    }
    touchStartX.current = null;
  };

  return (
    <Section>
      <div className="flex flex-col items-center mx-auto max-w-3xl text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900 leading-tight max-w-sm">
          Wait, it can really automate TikTok Pages?
        </h2>
        <p className="mt-4 text-lg text-zinc-600 font-semibold max-w-[30rem]">
          Yes! The TikToks below were 100% created &amp; published entirely with
          SlidesCockpit automations
        </p>
      </div>
      <div className="mx-auto mt-10 w-full max-w-5xl">
        <div
          className="relative w-full overflow-hidden p-1 sm:hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {TIKTOK_IMAGES.map((img, index) => (
              <div
                key={img.src}
                className="flex-shrink-0 basis-full px-0.5"
                aria-hidden={activeIndex !== index}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  className="h-auto w-full rounded-xl object-contain"
                  sizes="90vw"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 pb-2">
            {TIKTOK_IMAGES.map((img, index) => (
              <button
                key={img.src}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  activeIndex === index
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }`}
                aria-label={`Show slide ${index + 1}`}
                aria-current={activeIndex === index}
              />
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-2 gap-4 sm:grid">
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
      </div>
    </Section>
  );
}
