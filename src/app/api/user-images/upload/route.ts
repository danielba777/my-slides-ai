import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import path from "node:path";
import fs from "node:fs/promises";
import { db } from "@/server/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData();
  const files = form.getAll("files") as File[];
  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const userId = session.user.id;
  const baseDir = path.join(process.cwd(), "public", "user-images", userId);
  await fs.mkdir(baseDir, { recursive: true });

  const saved: { id: string; url: string }[] = [];
  for (const file of files) {
    const arrayBuf = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const ext = (file.type?.split("/")[1] || "jpg").toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const abs = path.join(baseDir, fileName);
    await fs.writeFile(abs, buf);
    const url = `/user-images/${userId}/${fileName}`;
    const rec = await db.userImage.create({
      data: { userId, url },
      select: { id: true, url: true },
    });
    saved.push(rec);
  }
  return NextResponse.json({ saved });
}