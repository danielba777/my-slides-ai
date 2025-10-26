"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function CheckoutRedirect() {
  const search = useSearchParams();
  const router = useRouter();
  const plan = search.get("plan") as "STARTER" | "GROWTH" | "SCALE" | "UNLIMITED" | null;

  useEffect(() => {
    if (!plan) {
      router.push("/");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const text = await res.text();
        if (!text) throw new Error("Empty response");
        const data = JSON.parse(text);
        if (data?.url) window.location.href = data.url;
        else {
          console.error("No checkout URL:", data);
          router.push("/");
        }
      } catch (err) {
        console.error("Checkout redirect error:", err);
        router.push("/");
      }
    })();
  }, [plan, router]);

  return (
    <div className="flex h-[80vh] items-center justify-center text-gray-600">
      Redirecting to Stripe Checkout…
    </div>
  );
}