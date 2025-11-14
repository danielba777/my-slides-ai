"use client";

import Link from "next/link";
import { AppLogo } from "../logo/AppLogo";

export function MarketingFooter() {
  return (
    <footer className="mt-10 sm:mt-16">
      <div className="mx-auto max-w-6xl px-5 pt-8 text-sm text-muted-foreground sm:px-6 sm:pt-10">
        <div className="flex flex-col gap-8 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
            <AppLogo size={42} />
          </div>
          <div className="grid grid-cols-2 gap-6 text-xs sm:flex sm:flex-row sm:gap-16 sm:text-sm">
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <h2 className="font-medium text-foreground">Product</h2>
              <Link href="#features" className="hover:text-foreground">
                Features
              </Link>
              <Link href="#pricing" className="hover:text-foreground">
                Pricing
              </Link>
            </div>
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <h2 className="font-medium text-foreground">Company</h2>
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </div>
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <h2 className="font-medium text-foreground">Legal</h2>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-border/60 py-8">
          <p className="text-center text-xs sm:text-sm">
            © 2025 SlidesCockpit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
