import { NextResponse } from "next/server";
import { utapi } from "@/app/api/uploadthing/core";

// Listet Sounds + optionales Cover (Naming: "<basename>.<ext>" & "<basename>.<ext>.cover.<imgext>")
export async function GET() {
  try {
    const list = await utapi.listFiles({ limit: 500, prefix: "ugc/sounds/" });
    const files = list.files ?? [];

    // Trenne Audio/Image – und mappe Cover anhand des gemeinsamen Basenamens vor ".cover."
    const isImage = (k: string) => /\.(png|jpe?g|webp|gif|avif)$/i.test(k);
    const isCover = (k: string) => /\.cover\.(png|jpe?g|webp|gif|avif)$/i.test(k);
    const isAudio = (k: string) => /\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(k) && !isCover(k);

    const images = new Map<string, any>(); // coverKeyByBase
    for (const f of files) {
      if (isImage(f.key) && isCover(f.key)) {
        const base = f.key.replace(/\.cover\.(png|jpe?g|webp|gif|avif)$/i, "");
        images.set(base, f);
      }
    }

    const items = files
      .filter((f: any) => isAudio(f.key))
      .map((f: any) => {
        const cover = images.get(f.key);
        return {
          key: f.key,
          name: f.name,
          size: f.size,
          url: f.url,
          ufsUrl: f.ufsUrl,
          coverUrl: cover?.ufsUrl || cover?.url || null,
        };
      });

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}