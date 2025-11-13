"use client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AppLogo } from "@/components/logo/AppLogo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

export function MarketingNavbar({ session }: { session: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className="fixed inset-x-0 top-4 z-50 w-full px-4 sm:px-6 transition-[transform,opacity]">
      <div
        className={[
          "mx-auto max-w-6xl",
          scrolled ? "translate-y-0 opacity-100" : "translate-y-0 opacity-100",
        ].join(" ")}
      >
        {/* Insel/Pill-Container */}
        <div
          className={[
            "flex items-center justify-between",
            "rounded-2xl border shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur",
            "px-4 sm:px-4 py-4",
            // Light/Dark & subtiler Akzent
            "bg-white/70 supports-[backdrop-filter]:bg-white/55",
            "dark:bg-slate-900/60",
            "border-[#304674]/15 ring-1 ring-[#304674]/10",
          ].join(" ")}
          style={{
            WebkitBackdropFilter: "blur(10px)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Left: Logo + Name */}
          <Link href="/" className="flex items-center gap-2 lg:pl-4 pl-0">
            <AppLogo size={40} />
            <span className="text-sm sm:text-xl font-semibold tracking-tight text-foreground">
              SlidesCockpit
            </span>
          </Link>

          {/* Right: Pricing + Auth */}
          <div className="flex items-center gap-3 sm:gap-6">
            <a
              href="#pricing"
              className="hidden sm:inline-flex text-base font-medium text-foreground/80 hover:text-foreground"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="hidden sm:inline-flex text-base font-medium text-foreground/80 hover:text-foreground"
            >
              FAQ
            </a>
            {session ? (
              <Link href="/dashboard/home">
                <Button
                  size="sm"
                  className="rounded-full bg-[#2A8AEC] text-white hover:bg-[#1f74c3]"
                >
                  Go to app
                </Button>
              </Link>
            ) : (
              <div className="scale-95 sm:scale-100 lg:pr-4 pl-2 pr-0">
                <GoogleSignInButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
