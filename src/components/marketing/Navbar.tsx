"use client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AppLogo } from "@/components/logo/AppLogo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function MarketingNavbar({ session }: { session: boolean }) {
  return (
    <header className="hidden md:block fixed inset-x-0 top-4 z-50 w-full px-6 transition-opacity">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-slate-900/70 px-6 py-4 text-white shadow-lg shadow-slate-900/40 backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <AppLogo size={42} />
            <span className="text-xl font-semibold tracking-tight">
              SlidesCockpit
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <a
              href="#pricing"
              className="hidden sm:inline-flex text-base font-medium text-white/80 hover:text-white"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="hidden sm:inline-flex text-base font-medium text-white/80 hover:text-white"
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
              <div className="scale-95 sm:scale-100">
                <GoogleSignInButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
