"use client";

import Link from "next/link";
import { AppLogo } from "../logo/AppLogo";

export function MarketingFooter() {
  return (
    <footer className="mt-10 sm:mt-16 ">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 pt-8 sm:pt-10 text-sm text-muted-foreground">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between pb-8">
          <div className="flex flex-col gap-2">
            <AppLogo size={42} />
          </div>
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 text-xs sm:text-sm">
            <div className="flex flex-col gap-2">
              <h2 className="font-medium text-foreground">Product</h2>
              <Link href="#features" className="hover:text-foreground">
                Features
              </Link>
              <Link href="#pricing" className="hover:text-foreground">
                Pricing
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-medium text-foreground">Company</h2>
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </div>
            <div className="flex flex-col gap-2">
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
          <p className="text-center">
            © 2025 SlidesCockpit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
