import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ images: [] });
  }
  const images = await db.userImage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, createdAt: true },
  });
  return NextResponse.json({ images });
}