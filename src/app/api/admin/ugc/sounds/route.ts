import { NextResponse } from "next/server";
import { env } from "@/env";
import { auth } from "@/server/auth";

export async function POST(req: Request) {
  const t0 = Date.now();
  const session = await auth();
  if (!session?.user?.id) {
    console.error("[SoundsUpload][POST] Unauthorized – no session.user.id");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!env.SLIDESCOCKPIT_API) {
    console.error("[SoundsUpload][POST] Missing env.SLIDESCOCKPIT_API");
    return NextResponse.json(
      { error: "Server misconfigured", detail: "SLIDESCOCKPIT_API not set" },
      { status: 500 },
    );
  }
  try {
    const form = await req.formData();
    const sound = form.get("sound");
    const cover = form.get("cover");
    const displayName = (form.get("name") as string | null)?.trim() || "";
    if (!(sound instanceof File)) {
      console.error("[SoundsUpload][POST] No sound file in multipart");
      return NextResponse.json({ error: "No sound file" }, { status: 400 });
    }

    const original = (sound.name || "sound.mp3").toLowerCase();
    const ext = original.includes(".") ? original.split(".").pop()! : "mp3";
    const baseSlug = (displayName || original)
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9._-]/gi, "_")
      .replace(/^_+|_+$/g, "");
    const baseName = `${Date.now()}-${baseSlug}${ext.startsWith(".") ? "" : "."}${ext}`;
    const soundKey = `ugc/sounds/${baseName}`;

    const coverIsFile = cover instanceof File;
    const coverExt = coverIsFile ? ((cover as File).name.split(".").pop() || "jpg").toLowerCase() : "jpg";
    const coverKey = coverIsFile ? `${soundKey}.cover.${coverExt}` : null;

    const presignUrl = `${env.SLIDESCOCKPIT_API}/sounds/presign?key=${encodeURIComponent(soundKey)}&contentType=${encodeURIComponent((sound as File).type || "audio/mpeg")}`;
    console.log("[SoundsUpload][POST] presign(sound) →", presignUrl);
    const presignRes = await fetch(presignUrl, {
      headers: { "x-user-id": session.user.id },
    });
    const presign = await presignRes.json().catch(() => null);
    if (!presignRes.ok || !presign?.uploadUrl || !presign?.publicUrl) {
      console.error("[SoundsUpload][POST] presign(sound) failed:", {
        status: presignRes.status,
        body: presign,
      });
      return NextResponse.json(
        { error: "Presign (sound) failed", detail: presign },
        { status: presignRes.status || 502 },
      );
    }

    const putSound = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": (sound as File).type || "audio/mpeg" },
      body: sound as File,
    });
    if (!putSound.ok) {
      const txt = await putSound.text().catch(() => "");
      console.error("[SoundsUpload][POST] PUT(sound) failed:", putSound.status, txt.slice(0, 400));
      return NextResponse.json(
        { error: "Upload sound failed", upstreamStatus: putSound.status, upstreamBodySnippet: txt.slice(0, 400) },
        { status: 502 },
      );
    }

    let coverPublicUrl: string | null = null;
    if (coverIsFile && coverKey) {
      const presignCoverUrl = `${env.SLIDESCOCKPIT_API}/sounds/presign?key=${encodeURIComponent(coverKey)}&contentType=${encodeURIComponent((cover as File).type || "image/jpeg")}`;
      console.log("[SoundsUpload][POST] presign(cover) →", presignCoverUrl);
      const presignCoverRes = await fetch(presignCoverUrl, {
        headers: { "x-user-id": session.user.id },
      });
      const presignCover = await presignCoverRes.json().catch(() => null);
      if (!presignCoverRes.ok || !presignCover?.uploadUrl || !presignCover?.publicUrl) {
        console.error("[SoundsUpload][POST] presign(cover) failed:", {
          status: presignCoverRes.status,
          body: presignCover,
        });
        return NextResponse.json(
          { error: "Presign (cover) failed", detail: presignCover },
          { status: presignCoverRes.status || 502 },
        );
      }
      const putCover = await fetch(presignCover.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": (cover as File).type || "image/jpeg" },
        body: cover as File,
      });
      if (!putCover.ok) {
        const txt = await putCover.text().catch(() => "");
        console.error("[SoundsUpload][POST] PUT(cover) failed:", putCover.status, txt.slice(0, 400));
        return NextResponse.json(
          { error: "Upload cover failed", upstreamStatus: putCover.status, upstreamBodySnippet: txt.slice(0, 400) },
          { status: 502 },
        );
      }
      coverPublicUrl = presignCover.publicUrl;
    }

    const t1 = Date.now();
    console.log("[SoundsUpload][POST] success", {
      key: soundKey,
      url: presign.publicUrl,
      coverUrl: coverPublicUrl,
      durationMs: t1 - t0,
    });
    return NextResponse.json({
      sound: { key: soundKey, url: presign.publicUrl },
      cover: coverPublicUrl ? { key: coverKey, url: coverPublicUrl } : null,
      name: displayName || baseSlug,
    });
  } catch (e: any) {
    console.error("[SoundsUpload][POST] failed:", e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}