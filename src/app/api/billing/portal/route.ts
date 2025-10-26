import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { stripe } from "@/server/stripe";
import { env } from "@/env";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeCustomerId) return new NextResponse("No Stripe customer", { status: 400 });

  // Build a valid absolute origin:
  // - Prefer NEXT_PUBLIC_APP_URL if it includes an explicit scheme
  // - Else fall back to the current request's origin
  const fromEnv = env.NEXT_PUBLIC_APP_URL?.trim();
  const hasScheme = !!fromEnv && /^https?:\/\//i.test(fromEnv);
  const origin = (hasScheme ? fromEnv! : new URL(req.url).origin).replace(/\/+$/, "");

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/dashboard/account/profile`,
  });
  return NextResponse.json({ url: portal.url });
}