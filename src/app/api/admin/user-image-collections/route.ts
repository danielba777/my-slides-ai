import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
  const session = await auth();
  // Simple Gate – passe ggf. an deine Admin-Logik an:
  if (!session?.user?.email) {
    return NextResponse.json([], { status: 200 });
  }
  try {
    // E-Mail kann null sein, wenn früher ohne E-Mail gespeichert
    const rows = await db.$queryRawUnsafe<
      Array<{ imageSetId: string; userId: string; email: string | null }>
    > (`SELECT "imageSetId","userId","email" FROM "UserImageCollection"`);
    return NextResponse.json(rows, { status: 200 });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}