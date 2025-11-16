
import { pikaImageToVideo } from "@/server/vendors/fal";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image_url, prompt, duration, resolution, aspect_ratio, mode } =
      body ?? {};

    const { requestId, videoUrl } = await pikaImageToVideo({
      image_url,
      prompt,
      duration,
      resolution,
      aspect_ratio,
      mode,
    });

    return NextResponse.json(
      { ok: true, requestId, videoUrl },
      { status: 200 },
    );
  } catch (err: unknown) {
    
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "Unknown error";

    
    const hint = /User 'v2\.2' not found/i.test(msg)
      ? "Fal meldet: User 'v2.2' not found → Bitte KEINE baseUrl/FAL_QUEUE_BASE_URL setzen und nur @fal-ai/client verwenden."
      : /JSON decode error|422/i.test(msg)
        ? "Fal meldet JSON decode error → Stelle sicher, dass der Body korrektes JSON sendet (kein doppeltes 'input')."
        : undefined;

    return NextResponse.json({ ok: false, error: msg, hint }, { status: 500 });
  }
}
