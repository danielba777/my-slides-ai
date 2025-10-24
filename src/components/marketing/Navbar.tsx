"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLogo } from "@/components/logo/AppLogo";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export function MarketingNavbar({ session }: { session: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={[
        "sticky top-0 z-40 w-full transition",
        scrolled
          ? "border-b border-border/60 bg-white/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80"
          : "bg-white/95"
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-6 py-3 sm:py-4">
         <Link href="/" className="flex items-center gap-2">
           <AppLogo size={28} />
          <span className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
             SlidesCockpit
           </span>
         </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
           <a href="#library" className="hover:text-foreground">Library</a>
           <a href="#pricing" className="hover:text-foreground">Pricing</a>
           <a href="#faq" className="hover:text-foreground">FAQ</a>
         </nav>
         <div className="flex items-center gap-2">
           {session ? (
             <Link href="/dashboard/home">
              <Button size="sm" className="rounded-full bg-[#304674] text-white hover:opacity-90">
                   Go to app
                 </Button>
            </Link>
          ) : (
            <GoogleSignInButton />
          )}
           </div>
         </div>
       </header>
  );
}