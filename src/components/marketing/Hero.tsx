"use client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  StarIcon,
  TrendingUpIcon,
  ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Section } from "./Section";

const HERO_BACKGROUND_IMAGE =
  "https://resizeapi.com/resize-cgi/image/format=auto,fit=cover,width=250,height=375,quality=50/https://r2-us-west.photoai.com/1725085001-91fd3e306fefd581da297aa8bf3dac3f-1.png";

const HERO_POSTER_ROWS = 12;
const HERO_POSTERS_PER_ROW = 28;

export function MarketingHero({ session }: { session: boolean }) {
  const [email, setEmail] = useState("");

  return (
    <Section className="relative min-h-[92vh] overflow-hidden bg-[#111]">
      <div className="netflix-container" aria-hidden="true">
        <div className="netflix-gradient" />
        <div className="netflix-container-perspective">
          <div className="netflix-container-background">
            {Array.from({ length: HERO_POSTER_ROWS }).map((_, rowIndex) => (
              <div key={`hero-row-${rowIndex}`} className="netflix-box">
                {Array.from({ length: HERO_POSTERS_PER_ROW }).map(
                  (_, itemIndex) => (
                    <div
                      key={`hero-row-${rowIndex}-item-${itemIndex}`}
                      className="netflix-thumbnail"
                      style={{
                        backgroundImage: `url(${HERO_BACKGROUND_IMAGE})`,
                      }}
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[92vh] flex-col justify-center px-5 sm:px-6 lg:pt-20 pt-20 pb-10">
        <div className="mx-auto max-w-5xl text-center">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 rounded-full border border-indigo-300/20 bg-indigo-500/10 backdrop-blur-sm px-4 py-2 text-xs sm:text-sm font-medium text-indigo-200 shadow-lg mb-2 sm:mb-4 lg:mb-6 mt-[-0.5rem] sm:mt-[-1rem]"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span>250M+ views generated with SlidesCockpit</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-indigo-300/30"></div>
            <div className="flex items-center gap-1">
              <TrendingUpIcon className="w-4 h-4" />
              <span>2025</span>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.7 }}
            className="py-4 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight text-white"
          >
            <span className="block">Automate TikTok slides</span>
            {/* Mobile ≈3 Zeilen, ab sm → 2 Zeilen */}
            <span className="block sm:inline sm:whitespace-nowrap">
              that actually&nbsp;
            </span>
            <span className="block sm:inline sm:whitespace-nowrap bg-gradient-to-r from-indigo-500 via-blue-300 to-blue-100 bg-clip-text text-transparent drop-shadow-sm">
              drive traffic
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-2 pb-8 text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light"
          >
            Create viral TikTok slides in seconds. Visually stunning, authentic,
            and built to perform.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            {session ? (
              <Link href="/dashboard/home" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-105 group"
                >
                  Go to the app
                  <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            ) : (
              <div className="w-full sm:w-auto">
                <GoogleSignInButton />
              </div>
            )}

            <a
              href="#library"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm sm:text-base font-medium underline-offset-4 hover:underline transition-all duration-200 px-2 py-1"
            >
              <StarIcon className="w-4 h-4 text-yellow-400" />
              Browse examples
            </a>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#304674] to-[#5676b9] flex items-center justify-center">
                  <ZapIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold">Live in seconds</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                From idea to finished slides instantly. No setup, no hassle.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#304674] to-[#5676b9] flex items-center justify-center">
                  <BarChart3Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold">
                  Templates that convert
                </h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Battle-tested winners. More reach, more followers.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#304674] to-[#5676b9] flex items-center justify-center">
                  <CheckCircle2Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold">Looks handcrafted</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Creator aesthetic instead of AI vibe. Natural and trustworthy.
              </p>
            </div>
          </motion.div>

          {/* Social proof stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-14 px-4"
          >
            <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-blue-300 to-blue-100 mb-1">
                    10M+
                  </div>
                  <div className="text-sm text-gray-300/90">TikTok Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    100+
                  </div>
                  <div className="text-sm text-gray-300/90">Happy creators</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    20K+
                  </div>
                  <div className="text-sm text-gray-300/90">
                    Slides produced
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    100%
                  </div>
                  <div className="text-sm text-gray-300/90">Success rate</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <style jsx global>{`
        .netflix-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          margin-bottom: 56px;
          background-color: #111;
          z-index: 1;
          pointer-events: none;
        }

        .netflix-gradient {
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
        }

        .netflix-container-perspective {
          perspective: 500px;
          height: 100%;
          position: relative;
        }

        .netflix-container-background {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          transform: rotateX(365deg) rotateY(352deg) rotateZ(10deg)
            translateX(1300px);
          transform-style: preserve-3d;
          animation: netflix_move 180s linear infinite alternate;
          will-change: transform;
        }

        .netflix-box {
          margin: 0px 0;
          display: flex;
          justify-content: flex-end;
          width: 100%;
          flex-wrap: nowrap;
          flex-grow: 1;
          transform: translateX(100px) translateY(-120px);
        }

        .netflix-thumbnail {
          transform-style: preserve-3d;
          transform: rotateX(20deg) rotateY(0deg) skewX(335deg);
          min-width: 125px;
          min-height: 187px;
          display: inline-block;
          background-position: center;
          background-size: cover;
          margin: 7px;
          border-radius: 12px;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.35);
          opacity: 0.9;
        }

        .netflix-cover {
          transform-style: preserve-3d;
          transform: rotateX(20deg) rotateY(0deg) skewX(335deg);
          min-width: 120px;
          min-height: 150px;
          display: inline-block;
          background-position: center;
          background-size: cover;
          margin: 0 0.2rem;
        }

        @keyframes netflix_move {
          from {
            transform: rotateX(365deg) rotateY(352deg) rotateZ(10deg)
              translateX(1300px);
          }
          to {
            transform: rotateX(365deg) rotateY(352deg) rotateZ(10deg)
              translateX(-190px);
          }
        }
      `}</style>
    </Section>
  );
}
