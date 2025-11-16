import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { utapi } from "@/app/api/uploadthing/core";
import { UTFile } from "uploadthing/server";

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
  const saved: { id: string; url: string }[] = [];

  
  
  const utFiles: UTFile[] = [];
  for (const file of files) {
    const buf = new Uint8Array(await file.arrayBuffer());
    
    const safeName =
      (file.name?.replace(/[^\w.\-]+/g, "_") || "image") +
      "_" +
      Date.now().toString();
    utFiles.push(new UTFile([buf], `users_${userId}__personal__${safeName}`));
  }

  const uploads = await utapi.uploadFiles(utFiles);

  for (const up of uploads) {
    if (!up?.data?.ufsUrl) continue; 
    const rec = await db.userImage.create({
      data: { userId, url: up.data.ufsUrl },
      select: { id: true, url: true },
    });
    saved.push(rec);
  }

  if (saved.length === 0) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
  return NextResponse.json({ saved });
}