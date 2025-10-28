import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { stripe } from "@/server/stripe";

const PLAN_TO_PRICE: Record<string, string> = {
  STARTER: process.env.STRIPE_PRICE_STARTER!,
  GROWTH: process.env.STRIPE_PRICE_GROWTH!,
  SCALE: process.env.STRIPE_PRICE_SCALE!,
  UNLIMITED: process.env.STRIPE_PRICE_UNLIMITED!,
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log("[STRIPE] No session, user not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json().catch(() => ({} as { plan?: keyof typeof PLAN_TO_PRICE }));
    if (!plan || !PLAN_TO_PRICE[plan]) {
      console.log("[STRIPE] Invalid plan or plan missing", plan);
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true },
    });
    if (!dbUser) {
      console.warn("[STRIPE] User not found for checkout", { userId: session.user.id });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = dbUser.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? dbUser.email ?? undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      await db.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
      console.log("[STRIPE] Created new customer:", customerId);
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    console.log("[STRIPE] Creating checkout session for plan:", plan, "→", PLAN_TO_PRICE[plan]);
    const sessionCheckout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: PLAN_TO_PRICE[plan], quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: { userId: session.user.id, plan },
    });

    if (!sessionCheckout?.url) {
      console.error("[STRIPE] Checkout session missing or failed", sessionCheckout);
      return NextResponse.json({ error: "Checkout session missing" }, { status: 500 });
    }

    console.log("[STRIPE] Checkout session created:", sessionCheckout.url);
    return NextResponse.json({ url: sessionCheckout.url }, { status: 200 });
  } catch (err) {
    // Wichtig: Immer JSON zurückgeben, damit der Client nicht bei res.json() crasht
    console.error("[STRIPE] Checkout error:", err);
    const message =
      err instanceof Error ? err.message : "Unexpected error while creating checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
