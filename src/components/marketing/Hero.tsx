"use client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AppLogo } from "@/components/logo/AppLogo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Menu, PlayIcon, TrendingUpIcon, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Section } from "./Section";

const HERO_POSTER_ROWS = 8;
const HERO_POSTERS_PER_ROW = 28;
const HERO_FETCH_LIMIT = 300;

type HeroSlide = {
  imageUrl?: string | null;
};

type HeroPost = {
  slides?: HeroSlide[];
};

export function MarketingHero({
  session,
  category,
  heroTitle,
  heroSubtitle,
}: {
  session: boolean;
  category?: string;
  heroTitle?: string;
  heroSubtitle?: string;
}) {
  const [posterImages, setPosterImages] = useState<string[]>([]);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSlides = async () => {
      try {
        const params = new URLSearchParams({
          limit: HERO_FETCH_LIMIT.toString(),
        });
        if (category) {
          params.set("category", category);
        }

        const response = await fetch(
          `/api/slideshow-library/hero-posts?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to load hero slides: ${response.status}`);
        }

        const data = (await response.json()) as unknown;
        if (!Array.isArray(data)) return;

        const collected = new Set<string>();

        for (const post of data as HeroPost[]) {
          if (!post?.slides?.length) continue;

          const firstSlideWithImage = post.slides.find(
            (slide) => !!slide?.imageUrl,
          );
          if (!firstSlideWithImage?.imageUrl) continue;
          collected.add(firstSlideWithImage.imageUrl);
        }

        if (!collected.size) return;

        const deduped = Array.from(collected);
        for (let index = deduped.length - 1; index > 0; index--) {
          const swapIndex = Math.floor(Math.random() * (index + 1));
          const current = deduped[index];
          const swap = deduped[swapIndex];
          if (current === undefined || swap === undefined) {
            continue;
          }
          deduped[index] = swap;
          deduped[swapIndex] = current;
        }

        setPosterImages(deduped);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Error loading hero slide images", error);
      }
    };

    void fetchSlides();

    return () => {
      controller.abort();
    };
  }, [category]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const posterMatrix = useMemo(() => {
    const perRow = HERO_POSTERS_PER_ROW;
    const totalRows = HERO_POSTER_ROWS;

    // Until we have real images, render nothing (no placeholders).
    if (!posterImages.length) return [];

    const rows: string[][] = [];
    for (let r = 0; r < totalRows; r++) {
      const start = r * perRow;
      const end = start + perRow;
      rows.push(posterImages.slice(start, end));
    }
    return rows;
  }, [posterImages]);

  // TikTok-Bilder NICHT über next/image rendern (Host-Whitelist von Next schlägt oft zu).
  // Alles andere weiter mit next/image (Optimierung bleibt erhalten).
  const isTikTokCdn = (urlStr: string) => {
    try {
      const u = new URL(urlStr);
      // Beispiele: p16-pu-sign-no.tiktokcdn-eu.com, p19-common-sign-useastred.tiktokcdn-eu.com, ...
      return /(^|\.)tiktokcdn(?:-eu)?\.com$/i.test(u.hostname);
    } catch {
      return false;
    }
  };

  return (
    <Section className="relative min-h-[55vh] overflow-hidden bg-[#111] py-0">
      {/* Mobile Header rendered directly in hero */}
      <div className="md:hidden absolute inset-x-0 top-0 z-30 px-4 pt-6">
        <div className="flex items-center justify-between text-white">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo size={34} />
            <span className="text-lg font-semibold tracking-tight">
              SlidesCockpit
            </span>
          </Link>
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-full p-2 text-white/90 transition hover:bg-white/10"
          >
            <Menu className="h-7 w-7" />
          </button>
        </div>
      </div>
      {/* Netflix Background - Fixed z-index hierarchy */}
      {posterMatrix.length > 0 && (
        <div className="hero-background-container">
          {/* Gradient Overlay */}
          <div className="hero-gradient-overlay" />

          {/* Animated Background */}
          <div className="hero-perspective-wrapper">
            <div className="hero-animated-grid">
              {posterMatrix.map((row, rowIndex) => (
                <div key={`hero-row-${rowIndex}`} className="hero-image-row">
                  {row.map((imageUrl, itemIndex) => (
                    <div
                      key={`hero-row-${rowIndex}-item-${itemIndex}`}
                      className="hero-image-card"
                    >
                      {isTikTokCdn(imageUrl) ? (
                        // Fallback auf <img> für TikTok-CDNs → keine Next-Whitelist nötig
                        <img
                          src={imageUrl}
                          alt=""
                          loading={rowIndex < 2 ? "eager" : "lazy"}
                          className="h-full w-full object-cover"
                          decoding="async"
                        />
                      ) : (
                        <Image
                          src={imageUrl}
                          alt=""
                          fill
                          /* Nur für die kleinen Kacheln: extrem klein halten */
                          sizes="125px"
                          /* Next darf optimieren -> erzeugt AVIF/WebP automatisch */
                          quality={60}
                          // Avoid Next.js runtime error: can't set both priority and loading
                          // Use priority for first 2 rows, lazy for the rest
                          priority={rowIndex < 2}
                          loading={rowIndex < 2 ? undefined : "lazy"}
                          style={{
                            objectFit: "cover",
                            objectPosition: "center",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="hero-content-wrapper">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 rounded-full border border-[#2A8AEC4D] bg-[#2A8AEC33] backdrop-blur-xl px-4 py-2 text-xs sm:text-sm font-medium text-[#E5F1FF] shadow-lg mb-2 sm:mb-4 lg:mb-6 mt-[-0.5rem] sm:mt-[-1rem]"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span>10M+ views generated</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-[#2A8AEC40]"></div>
            <div className="flex items-center gap-1">
              <TrendingUpIcon className="w-4 h-4" />
              <span>2025</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.7 }}
            className="py-2 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight text-white"
          >
            {heroTitle ? (
              (() => {
                const words = heroTitle.split(" ");

                if (words.length < 3) {
                  return <span className="block">{heroTitle}</span>;
                }

                const lastTwoWords = words.slice(-2).join(" ");
                const restOfTitle = words.slice(0, -2).join(" ");

                return (
                  <>
                    <span className="block sm:inline">{restOfTitle}&nbsp;</span>
                    <span className="block sm:inline sm:whitespace-nowrap bg-gradient-to-r from-indigo-500 via-blue-300 to-blue-100 bg-clip-text text-transparent drop-shadow-sm">
                      {lastTwoWords}
                    </span>
                  </>
                );
              })()
            ) : (
              <>
                <span className="block">Automate TikToks that</span>
                <span className="block sm:inline sm:whitespace-nowrap">
                  drive traffic to your website{" "}
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-2 pb-4 text-lg sm:text-xl lg:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-semibold"
          >
            {heroSubtitle || "use AI to generate posts that don't feel like AI"}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            {session ? (
              <Link href="/dashboard/home" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-10 py-5 text-lg font-semibold text-white bg-[#2A8AEC] hover:bg-[#1f74c3] shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300"
                >
                  Go to app
                </Button>
              </Link>
            ) : (
              <div className="w-full sm:w-auto">
                <GoogleSignInButton />
              </div>
            )}

            <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-10 py-5 text-lg font-semibold text-slate-900 bg-gray-100 hover:bg-gray-200 shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300"
                >
                  Watch demo
                </Button>
              </DialogTrigger>
              <DialogContent
                className="w-full max-w-4xl border-none bg-white p-4 sm:p-6 sm:rounded-3xl space-y-4"
                shouldHaveClose={false}
                ariaLabel="SlidesCockpit demo video"
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-slate-900">
                    Watch demo
                  </p>
                  <DialogClose className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close demo</span>
                  </DialogClose>
                </div>
                <div
                  className="relative w-full overflow-hidden rounded-2xl bg-black"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={
                      isDemoOpen
                        ? "https://www.youtube.com/embed/qOBM-NEeFqQ?autoplay=1&rel=0"
                        : "about:blank"
                    }
                    title="SlidesCockpit demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12 flex justify-center"
          >
            <div className="relative w-full max-w-5xl rounded-[20px] bg-blue-200/95 border border-white/20 shadow-2xl shadow-indigo-900/20 p-2 sm:p-1">
              <a
                href="https://www.youtube.com/watch?v=qOBM-NEeFqQ&t=7s"
                target="_blank"
                rel="noreferrer"
                aria-label="Watch the SlidesCockpit product demo on YouTube"
                className="group relative block overflow-hidden rounded-2xl"
              >
                <div
                  className="relative w-full overflow-hidden rounded-2xl bg-black"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <img
                    src="/hero-demo.gif"
                    alt="SlidesCockpit demo preview"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-slate-900/10 to-transparent" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-[#2A8AEC] shadow-2xl transition-transform duration-300 group-hover:scale-110">
                      <PlayIcon className="h-7 w-7 translate-x-[1px]" />
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 text-white">
          <div className="flex h-full flex-col px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AppLogo size={36} />
                <span className="text-xl font-semibold">SlidesCockpit</span>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-full p-2 text-white/80 transition hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-12 flex flex-col gap-6 text-2xl font-semibold">
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="transition hover:text-blue-200"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="transition hover:text-blue-200"
              >
                FAQ
              </a>
            </nav>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Background Container - Lowest layer */
        .hero-background-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: #111;
          z-index: 1;
          pointer-events: none;
          /* Create isolated stacking context */
          isolation: isolate;
          /* Promote to own layer */
          will-change: transform;
          transform: translateZ(0);
        }

        /* Gradient Overlay - Above background */
        .hero-gradient-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.8) 15%,
            rgba(0, 0, 0, 0.8) 50%,
            rgba(0, 0, 0, 0.95) 70%,
            rgba(0, 0, 0, 0.6) 95%,
            rgba(0, 0, 0, 1) 100%
          );
          opacity: 0.65;
          pointer-events: none;
          /* Fixed property for better performance */
          will-change: opacity;
        }

        /* Perspective Wrapper */
        .hero-perspective-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          perspective: 500px;
          perspective-origin: center center;
          z-index: 1;
          /* Contain layout and paint for performance */
          contain: layout style paint;
        }

        /* Animated Grid */
        .hero-animated-grid {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          transform: rotateX(5deg) rotateY(-8deg) rotateZ(10deg)
            translateX(1300px) translateZ(0);
          transform-style: preserve-3d;
          animation: heroBackgroundMove 180s linear infinite alternate;
          /* Force GPU acceleration */
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          -webkit-transform-style: preserve-3d;
        }

        /* Image Rows */
        .hero-image-row {
          margin: 0;
          display: flex;
          justify-content: flex-end;
          width: 100%;
          flex-wrap: nowrap;
          flex-grow: 1;
          transform: translateX(100px) translateY(-120px) translateZ(0);
          /* Prevent layout thrashing */
          contain: layout style;
        }

        /* Individual Image Cards */
        .hero-image-card {
          position: relative;
          transform-style: preserve-3d;
          transform: rotateX(20deg) rotateY(0deg) skewX(335deg) translateZ(0);
          min-width: 125px;
          min-height: 187px;
          display: inline-block;
          margin: 7px;
          border-radius: 12px;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.35);
          opacity: 0.9;
          overflow: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          /* Performance optimization */
          will-change: transform;
        }

        /* Content Wrapper - keep it BELOW the fixed navbar (navbar is z-50) */
        .hero-content-wrapper {
          position: relative;
          /* Navbar has z-50 — set hero below it to avoid overlapping while scrolling */
          z-index: 20;
          /* Create new stacking context isolated from background */
          isolation: isolate;
          /* Promote to own layer */
          will-change: transform;
          transform: translateZ(0);
          min-height: 89vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 5rem 1.25rem 2.5rem;
        }

        @media (min-width: 640px) {
          .hero-content-wrapper {
            padding: 5rem 1.5rem 2.5rem;
          }
        }

        @media (min-width: 1024px) {
          .hero-content-wrapper {
            padding-top: 5rem;
          }
        }

        /* Optimized Animation */
        @keyframes heroBackgroundMove {
          from {
            transform: rotateX(5deg) rotateY(-8deg) rotateZ(10deg)
              translateX(1300px) translateZ(0);
          }
          to {
            transform: rotateX(5deg) rotateY(-8deg) rotateZ(10deg)
              translateX(-190px) translateZ(0);
          }
        }

        /* Force hardware acceleration for smooth animation */
        @media (prefers-reduced-motion: no-preference) {
          .hero-animated-grid {
            animation-play-state: running;
          }
        }

        /* Pause animation if user prefers reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .hero-animated-grid {
            animation-play-state: paused;
          }
        }
      `}</style>
    </Section>
  );
}
