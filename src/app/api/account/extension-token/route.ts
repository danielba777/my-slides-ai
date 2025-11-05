import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { extensionToken: true },
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  if (user.extensionToken) {
    return NextResponse.json({ token: user.extensionToken });
  }

  const token = randomUUID();

  await db.user.update({
    where: { id: session.user.id },
    data: { extensionToken: token },
  });

  return NextResponse.json({ token });
}

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const token = randomUUID();

  await db.user.update({
    where: { id: session.user.id },
    data: { extensionToken: token },
  });

  return NextResponse.json({ token });
}
