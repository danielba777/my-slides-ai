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

export function MarketingHero({ session }: { session: boolean }) {
  const [email, setEmail] = useState("");

  return (
    <Section className="relative min-h-[92vh] overflow-hidden bg-slate-950">
      {/* Background decorations */}
      <div
        className="absolute inset-0 opacity-30 bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg%20width='80'%20height='80'%20viewBox='0%200%2080%2080'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cg%20fill='%23304674'%20fill-opacity='0.05'%3E%3Cpath%20d='M40%200h40v40H40z'/%3E%3Cpath%20d='M0%2040h40v40H0z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Accent glow */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(48, 70, 116, 0.25) 0%, rgba(48, 70, 116, 0.12) 30%, transparent 70%)",
        }}
      />

      {/* Grid */}
      <svg
        className="absolute inset-0 h-full w-full opacity-30"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="rgba(48,70,116,0.15)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="relative z-10 flex min-h-[92vh] flex-col justify-center px-5 sm:px-6 lg:pt-20 pt-20 pb-10">
        <div className="mx-auto max-w-5xl text-center">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 rounded-full border border-indigo-300/20 bg-indigo-500/10 backdrop-blur-sm px-4 py-2 text-xs sm:text-sm font-medium text-indigo-200 shadow-lg mb-6"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span>250M+ Aufrufe mit SlidesCockpit generiert</span>
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
            className="py-8 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight text-white"
          >
            <span className="block">Automatisiere TikTok Slides,</span>
            {/* Mobile ≈3 Zeilen, ab sm → 2 Zeilen */}
            <span className="block sm:inline sm:whitespace-nowrap">
              die wirklich&nbsp;
            </span>
            <span className="block sm:inline sm:whitespace-nowrap bg-gradient-to-r from-indigo-500 via-blue-300 to-blue-100 bg-clip-text text-transparent drop-shadow-sm">
              Traffic bringen
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-8 pb-8 text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light"
          >
            Planung, Erstellung und Publishing in Minuten. Professionelle
            Typografie, pixelperfekte Slides und Automatisierungen, die nicht
            nach KI aussehen.
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
                  Zur App gehen
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
              Beispiele ansehen
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
                <h3 className="text-white font-semibold">In 10 Min. live</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Von Hook bis Export – ohne Fummelei.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#304674] to-[#5676b9] flex items-center justify-center">
                  <BarChart3Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold">
                  Vorlagen, die ziehen
                </h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Analysierte Winners. Mehr Reach, mehr Follows.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#304674] to-[#5676b9] flex items-center justify-center">
                  <CheckCircle2Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold">
                  Sieht nicht nach KI aus
                </h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Creator-Look statt AI-Vibe. Natürlich & glaubwürdig.
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
                    250M+
                  </div>
                  <div className="text-sm text-gray-300/90">TikTok Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    50K+
                  </div>
                  <div className="text-sm text-gray-300/90">
                    Zufriedene Nutzer
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    1M+
                  </div>
                  <div className="text-sm text-gray-300/90">
                    Erstellte Slides
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    98%
                  </div>
                  <div className="text-sm text-gray-300/90">Erfolgsquote</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
