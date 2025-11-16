import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { stripe } from "@/server/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  let customerId = user?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await db.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: customerId } });
  }

  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const hasScheme = !!fromEnv && /^https?:\/\//i.test(fromEnv);
  const origin = (hasScheme ? fromEnv! : new URL(req.url).origin).replace(/\/+$/, "");

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId!,
    return_url: `${origin}/dashboard/account/profile`,
  });
  return NextResponse.json({ url: portal.url });
}
