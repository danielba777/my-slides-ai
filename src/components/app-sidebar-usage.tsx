"use client";

import { useEffect, useState } from "react";

import { use } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import useSWR from "swr";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarketingPricing } from "@/components/marketing/Pricing";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UsageResponse {
  aiLeft?: number;
  slidesLeft?: number;
  plan?: string | null;
  unlimited?: boolean;
}

type UsageState = {
  aiLeft: number | null;
  slidesLeft: number | null;
  plan: string | null;
  unlimitedSlides: boolean;
  hasActiveSubscription: boolean;
};

export function SidebarUsageSummary() {
  const [isBillingRedirecting, setIsBillingRedirecting] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  
  const getUserId = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("uid") ?? "anon";
    }
    return "anon";
  };

  const { data: usageData, isLoading, error, mutate } = useSWR(
    "/api/billing/usage",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000,
      tags: [`usage-${getUserId()}`],
    }
  );

  const usage = usageData ? {
    aiLeft:
      typeof usageData.aiCredits === "number"
        ? usageData.aiCredits
        : Number.isFinite(usageData.aiCredits)
          ? Number(usageData.aiCredits)
          : usageData.aiCredits === Infinity
            ? Number.POSITIVE_INFINITY
            : null,
    slidesLeft:
      typeof usageData.credits === "number"
        ? usageData.credits
        : usageData.credits === Infinity
          ? Number.POSITIVE_INFINITY
          : null,
    plan: usageData.plan ?? null,
    unlimitedSlides: usageData.credits < 0 || usageData.credits === Infinity,
    hasActiveSubscription: Boolean(usageData.plan),
  } : null;

  const isError = !!error;

  const renderInfinite = (value: number | null) =>
    value !== null && !Number.isFinite(value);

  const renderSlides = () => {
    if (!usage) return "– credits";
    if (usage.unlimitedSlides || renderInfinite(usage.slidesLeft)) {
      return "∞ credits";
    }
    const count = Math.max(0, Math.floor(usage.slidesLeft ?? 0));
    return `${count} ${count === 1 ? "credit" : "credits"}`;
  };

  const renderAiCredits = () => {
    if (!usage) return "– ai credits";
    if (renderInfinite(usage.aiLeft)) {
      return "∞ ai credits";
    }
    const count = Math.max(0, Math.floor(usage.aiLeft ?? 0));
    return `${count} ${count === 1 ? "ai credit" : "ai credits"}`;
  };

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
        Unable to load usage
      </div>
    );
  }

  if (isLoading || !usage) {
    return (
      <div
        className={cn(
          "rounded-xl border-zinc-300 border px-3 py-3 text-xs flex flex-col gap-2",
          "bg-[#F1F2ED]",
        )}
      >
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-3 w-28 mx-auto" />
        <Skeleton className="h-8 w-full rounded-sm" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border-zinc-300 border px-3 py-2 text-xs flex flex-col gap-1",
        "bg-[#F1F2ED] text-sidebar-foreground/90",
      )}
    >
      <div className="text-sm text-center font-medium text-sidebar-foreground">
        <span>{renderSlides()}</span>
        <span className="mx-2 text-sidebar-foreground/60">|</span>
        <span>{renderAiCredits()}</span>
      </div>
      <div className="flex items-center justify-center text-sidebar-foreground text-center">
        {usage.plan ? (
          <span className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">
            {usage.plan} Plan
          </span>
        ) : (
          <span className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">
            No active subscription
          </span>
        )}
      </div>
      <div>
        {usage.hasActiveSubscription ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-sm border-sidebar-border/80 bg-[#F7F8F3]/60 text-sidebar-foreground hover:bg-sidebar/70 disabled:opacity-40"
            disabled={isBillingRedirecting}
            onClick={async () => {
              try {
                setIsBillingRedirecting(true);
                const response = await fetch("/api/billing/portal", {
                  method: "POST",
                });
                if (!response.ok) {
                  throw new Error("Failed to open billing portal");
                }
                const data = (await response.json()) as { url?: string };
                if (!data.url) {
                  throw new Error("Missing billing portal URL");
                }
                window.location.assign(data.url);
              } catch (error) {
                console.error(error);
                toast.error("Could not open billing portal");
              } finally {
                setIsBillingRedirecting(false);
              }
            }}
          >
            Manage Plan
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-sm border-sidebar-border/80 bg-[#F7F8F3]/60 text-sidebar-foreground hover:bg-sidebar/70"
              onClick={() => setIsPricingOpen(true)}
            >
              Choose plan
            </Button>
            <Dialog open={isPricingOpen} onOpenChange={setIsPricingOpen}>
              <DialogContent className="max-w-7xl w-[98vw]">
                <DialogTitle className="sr-only">Choose a plan</DialogTitle>
                {}
                <MarketingPricing session={true} compact />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}


export function refreshUsageData() {
  if (typeof window !== "undefined") {
    
    const userId = localStorage.getItem("uid") ?? "anon";
    fetch("/api/billing/usage/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).catch(console.warn);
  }
}
