import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getUsageLimits } from "@/server/billing";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limits = await getUsageLimits(session.user.id);
  return NextResponse.json(limits);
}