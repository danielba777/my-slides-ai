"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// PlanButton component for the pricing cards
function PlanButton({
  plan,
  session,
  variant = "default",
  label,
}: {
  plan: string;
  session?: boolean;
  variant?: "default" | "primary";
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const PLAN_MAP: Record<string, "STARTER" | "GROWTH" | "SCALE" | "UNLIMITED"> =
    {
      starter: "STARTER",
      growth: "GROWTH",
      scale: "SCALE",
      unlimited: "UNLIMITED",
    };

  async function startCheckout() {
    const serverPlan = PLAN_MAP[plan];
    if (!serverPlan) return;

    if (!session) {
      router.push(`/auth/signin?callbackUrl=/checkout?plan=${serverPlan}`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: serverPlan }),
      });

      let data: any = null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      } else {
        const text = await res.text().catch(() => "");
        console.error("Checkout non-JSON response:", text);
      }

      if (!res.ok || !data?.url) {
        console.error("Checkout error", { status: res.status, data });
        toast.error(
          data?.error
            ? `Checkout failed: ${data.error}`
            : `Checkout failed (${res.status}). Please try again.`,
        );
        return;
      }
      window.location.href = data.url as string;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      className={`w-full rounded-lg px-4 py-2 font-medium transition ${
        variant === "primary"
          ? "bg-[#304674] text-white hover:opacity-90"
          : "bg-[#f5f6fa] text-[#304674] hover:bg-[#e8eefc]"
      } disabled:opacity-50`}
    >
      {loading ? "Redirecting…" : label || "Choose plan"}
    </button>
  );
}

const tiers = [
  {
    name: "Starter",
    price: "€19",
    priceId: "price_starter",
    features: [
      "25 monthly credits",
      "50 monthly AI credits",
      "Create slideshows",
      "AI avatars",
    ],
  },
  {
    name: "Growth",
    price: "€49",
    highlight: true,
    badge: "Most popular",
    features: [
      "100 monthly credits",
      "150 monthly AI credits",
      "Everything from Starter",
      "Priority queue",
    ],
  },
  {
    name: "Scale",
    price: "€95",
    features: [
      "250 monthly credits",
      "300 monthly AI credits",
      "Everything from Growth",
      "Priority support",
    ],
  },
  {
    name: "Unlimited",
    price: "€195",
    badge: "Premium",
    features: [
      "Unlimited credits",
      "1,000 monthly AI credits",
      "Everything from Scale",
      "White-glove support",
    ],
  },
];

type Props = {
  session?: boolean;
  /** Compact variant for in-app modal (less top spacing, tighter header) */
  compact?: boolean;
};

export function MarketingPricing({ session, compact }: Props) {
  return (
    <section className="w-full">
      <div
        className={`mx-auto ${compact ? "max-w-7xl" : "max-w-6xl"} px-4 md:px-8`}
      >
        <h2
          className={[
            "font-extrabold tracking-tight text-[#0F172A] text-center",
            compact
              ? "text-4xl md:text-5xl mt-2 md:mt-3"
              : "text-4xl md:text-6xl mt-4 md:mt-6",
          ].join(" ")}
        >
          Pricing
        </h2>
        <p
          className={[
            "text-center text-slate-600",
            compact ? "mt-2 mb-6 md:mb-8" : "mt-3 md:mt-4 mb-10 md:mb-16",
          ].join(" ")}
        >
          Pick the plan that matches your next growth stage.
        </p>
        <div
          className={[
            "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
            "gap-5 md:gap-6",
          ].join(" ")}
        >
          {/* Starter */}
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold">Starter</h3>
              {/* badge top */}
              {/* (keine) */}
            </div>
            <p className="mt-1 text-3xl font-extrabold">€19</p>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>25 monthly credits</li>
              <li>50 monthly AI credits</li>
              <li>Create slideshows</li>
              <li>AI avatars</li>
            </ul>
            <div className="mt-6">
              <PlanButton plan="starter" session={session} />
            </div>
          </div>

          {/* Growth */}
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold">Growth</h3>
              <span
                className={[
                  "absolute top-4 right-4",
                  "inline-flex items-center justify-center rounded-full",
                  "bg-indigo-50 text-indigo-700",
                  "text-[13px] font-medium leading-none",
                  "px-3.5 py-2 whitespace-nowrap text-center",
                ].join(" ")}
              >
                Most popular
              </span>
            </div>
            <p className="mt-1 text-3xl font-extrabold">€49</p>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>100 monthly credits</li>
              <li>150 monthly AI credits</li>
              <li>Everything from Starter</li>
              <li>Priority queue</li>
            </ul>
            <div className="mt-6">
              <PlanButton
                plan="growth"
                session={session}
                variant="primary"
                label="Start with Growth"
              />
            </div>
          </div>

          {/* Scale */}
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold">Scale</h3>
              {/* badge none */}
            </div>
            <p className="mt-1 text-3xl font-extrabold">€95</p>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>250 monthly credits</li>
              <li>300 monthly AI credits</li>
              <li>Everything from Growth</li>
              <li>Priority support</li>
            </ul>
            <div className="mt-6">
              <PlanButton plan="scale" session={session} />
            </div>
          </div>

          {/* Unlimited */}
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold">Unlimited</h3>
              <span
                className={[
                  "absolute top-4 right-4",
                  "inline-flex items-center justify-center rounded-full",
                  "bg-slate-100 text-slate-700",
                  "text-[13px] font-medium leading-none",
                  "px-3.5 py-2 whitespace-nowrap text-center",
                ].join(" ")}
              >
                Premium
              </span>
            </div>
            <p className="mt-1 text-3xl font-extrabold">€195</p>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>Unlimited credits</li>
              <li>1,000 monthly AI credits</li>
              <li>Everything from Scale</li>
              <li>White-glove support</li>
            </ul>
            <div className="mt-6">
              <PlanButton plan="unlimited" session={session} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
