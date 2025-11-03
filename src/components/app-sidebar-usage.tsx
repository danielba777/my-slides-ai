"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isBillingRedirecting, setIsBillingRedirecting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/billing/limits", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to load usage limits");
        }
        const data: UsageResponse = await response.json();
        if (!isMounted) return;

        setUsage({
          aiLeft:
            typeof data.aiLeft === "number"
              ? data.aiLeft
              : Number.isFinite(data.aiLeft)
                ? Number(data.aiLeft)
                : data.aiLeft === Infinity
                  ? Number.POSITIVE_INFINITY
                  : null,
          slidesLeft:
            typeof data.slidesLeft === "number"
              ? data.slidesLeft
              : data.slidesLeft === Infinity
                ? Number.POSITIVE_INFINITY
                : null,
          plan: data.plan ?? null,
          unlimitedSlides: Boolean(data.unlimited),
          hasActiveSubscription: Boolean(data.plan),
        });
        setIsError(false);
      } catch (error) {
        console.error("Failed to fetch usage limits", error);
        if (!isMounted) return;
        setIsError(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderInfinite = (value: number | null) =>
    value !== null && !Number.isFinite(value);

  const renderSlides = () => {
    if (!usage) return "– slides";
    if (usage.unlimitedSlides || renderInfinite(usage.slidesLeft)) {
      return "∞ slides";
    }
    const count = Math.max(0, Math.floor(usage.slidesLeft ?? 0));
    return `${count} ${count === 1 ? "slide" : "slides"}`;
  };

  const renderAiCredits = () => {
    if (!usage) return "– credits";
    if (renderInfinite(usage.aiLeft)) {
      return "∞ credits";
    }
    const count = Math.max(0, Math.floor(usage.aiLeft ?? 0));
    return `${count} ${count === 1 ? "credit" : "credits"}`;
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
      <div className="">
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-sm border-sidebar-border/80 bg-[#F7F8F3]/60 text-sidebar-foreground hover:bg-sidebar/70 disabled:opacity-40"
          disabled={!usage.hasActiveSubscription || isBillingRedirecting}
          onClick={async () => {
            if (!usage.hasActiveSubscription) {
              return;
            }
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
      </div>
    </div>
  );
}
