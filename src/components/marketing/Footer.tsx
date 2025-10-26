"use client";

import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="mt-10 sm:mt-16 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-8 sm:py-10 text-sm text-muted-foreground">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} SlidesCockpit. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="#pricing" className="hover:text-foreground">Pricing</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
