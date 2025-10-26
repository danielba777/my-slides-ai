Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

1. src/app/api/user-images/list/route.ts
   \*\*\* a/src/app/api/user-images/list/route.ts
   --- b/src/app/api/user-images/list/route.ts
   @@
   -import { NextResponse } from "next/server";
   -import { getServerSession } from "next-auth";
   -import { authOptions } from "@/lib/auth";
   -import { prisma } from "@/lib/prisma";
   +import { NextResponse } from "next/server";
   +import { auth } from "@/server/auth";
   +import { db } from "@/server/db";

export async function GET() {

- const session = await getServerSession(authOptions);
- if (!session?.user?.id) {

* const session = await auth();
* if (!session?.user?.id) {
  return NextResponse.json({ images: [] });
  }

- const images = await prisma.userImage.findMany({

* const images = await db.userImage.findMany({
  where: { userId: session.user.id },
  orderBy: { createdAt: "desc" },
  select: { id: true, url: true, createdAt: true },
  });
  return NextResponse.json({ images });
  }

2. src/app/api/user-images/upload/route.ts
   \*\*\* a/src/app/api/user-images/upload/route.ts
   --- b/src/app/api/user-images/upload/route.ts
   @@
   -import { NextResponse } from "next/server";
   -import { getServerSession } from "next-auth";
   -import { authOptions } from "@/lib/auth"; // passt ggf. an eure Auth-Location an
   +import { NextResponse } from "next/server";
   +import { auth } from "@/server/auth";
   import path from "node:path";
   import fs from "node:fs/promises";
   -import { prisma } from "@/lib/prisma";
   +import { db } from "@/server/db";

export async function POST(req: Request) {

- const session = await getServerSession(authOptions);

* const session = await auth();
  if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  @@
  const saved: { id: string; url: string }[] = [];
  for (const file of files) {
  @@

- const rec = await prisma.userImage.create({

* const rec = await db.userImage.create({
  data: { userId, url },
  select: { id: true, url: true },
  });
  saved.push(rec);
  }
  return NextResponse.json({ saved });
  }
