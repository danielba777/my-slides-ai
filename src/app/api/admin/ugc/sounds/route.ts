import { NextResponse } from "next/server";
import { utapi } from "@/app/api/uploadthing/core";

// POST multipart/form-data
// fields:
//  - sound (audio/*)  REQUIRED
//  - cover (image/*)  OPTIONAL
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const sound = form.get("sound");
    const cover = form.get("cover");
    if (!(sound instanceof File)) {
      return NextResponse.json({ error: "No sound file" }, { status: 400 });
    }

    const baseName = `${Date.now()}-${sound.name.replace(/\s+/g, "_")}`;
    const soundKey = `ugc/sounds/${baseName}`;

    const soundUploadInput = new File([await sound.arrayBuffer()], soundKey, {
      type: sound.type || "audio/mpeg",
    });

    const wantsCover = cover instanceof File;
    const coverExt = wantsCover ? (cover.name.split(".").pop() || "jpg").toLowerCase() : "jpg";
    const coverKey = `ugc/sounds/${baseName}.cover.${coverExt}`;
    const coverUploadInput = wantsCover
      ? new File([await (cover as File).arrayBuffer()], coverKey, {
          type: (cover as File).type || "image/jpeg",
        })
      : null;

    const uploads = await utapi.uploadFiles(coverUploadInput ? [soundUploadInput, coverUploadInput] : [soundUploadInput]);
    const s = uploads[0];
    const c = coverUploadInput ? uploads[1] : null;

    if (!s?.data?.ufsUrl) {
      return NextResponse.json({ error: s?.error ?? "Upload failed" }, { status: 400 });
    }
    return NextResponse.json({
      sound: { key: s.data.key, ufsUrl: s.data.ufsUrl, url: s.data.url },
      cover: c?.data ? { key: c.data.key, ufsUrl: c.data.ufsUrl, url: c.data.url } : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}