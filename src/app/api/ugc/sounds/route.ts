import { NextResponse } from "next/server";
import { env } from "@/env";
import { auth } from "@/server/auth";


export async function GET() {
  const t0 = Date.now();
  const session = await auth();
  if (!session?.user?.id) {
    console.error("[SoundsProxy][GET] Unauthorized – no session.user.id");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!env.SLIDESCOCKPIT_API) {
    console.error("[SoundsProxy][GET] Missing env.SLIDESCOCKPIT_API");
    return NextResponse.json(
      { error: "Server misconfigured", detail: "SLIDESCOCKPIT_API not set" },
      { status: 500 },
    );
  }
  try {
    const upstreamUrl = `${env.SLIDESCOCKPIT_API}/sounds`;
    console.log("[SoundsProxy][GET] →", upstreamUrl, { userId: session.user.id });
    const res = await fetch(upstreamUrl, {
      method: "GET",
      headers: { "x-user-id": session.user.id },
      cache: "no-store",
      redirect: "manual",
    });
    const clone = res.clone();
    const textBody = await clone.text().catch(() => "");
    const data = await res.json().catch(() => null);
    const t1 = Date.now();
    const logOut = {
      status: res.status,
      statusText: res.statusText,
      url: upstreamUrl,
      durationMs: t1 - t0,
      contentType: res.headers.get("content-type"),
      bodyPreview: textBody.slice(0, 400),
    };
    if (!res.ok) {
      console.error("[SoundsProxy][GET] Upstream error:", logOut);
      return NextResponse.json(
        {
          error: "Failed to load sounds",
          upstreamStatus: res.status,
          upstreamUrl,
          upstreamBodySnippet: logOut.bodyPreview,
        },
        { status: res.status || 502 },
      );
    }
    console.log("[SoundsProxy][GET] Upstream success:", logOut);
    
    const items = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.sounds)
        ? data.sounds
        : Array.isArray(data)
          ? data
          : [];
    
    const cleanName = (raw: string): string => {
      try {
        if (!raw) return "Unbenannt";
        
        const base = raw.split("/").pop() || raw;
        
        const noExt = base.replace(/\.[a-z0-9]+$/i, "");
        
        const noStamp = noExt.replace(/^[\d]+[-_]+/i, "");
        
        const spaced = noStamp.replace(/[-_]+/g, " ");
        
        const pretty = spaced.replace(/\s{2,}/g, " ").trim();
        
        return pretty || "Unbenannt";
      } catch {
        return "Unbenannt";
      }
    };

    const normalized = items.map((it: any) => {
      
      const rawName: string =
        (typeof it?.name === "string" && it.name.trim().length > 0
          ? it.name
          : (typeof it?.filename === "string" ? it.filename : "")) ||
        (typeof it?.key === "string" ? it.key : "") ||
        (typeof it?.url === "string" ? it.url : "") ||
        "";

      return {
        key: String(it.key ?? it.id ?? it.url ?? crypto.randomUUID()),
        
        name: cleanName(rawName),
        size: Number(it.size ?? 0),
        url: it.url ?? null,
        ufsUrl: it.ufsUrl ?? null,
        coverUrl: it.coverUrl ?? null,
      };
    });
    console.log("[SoundsProxy][GET] normalized items:", normalized.length);
    return NextResponse.json({ items: normalized });
  } catch (error: any) {
    console.error("[SoundsProxy][GET] proxy failed:", error);
    return NextResponse.json({ error: String(error?.message ?? error) }, { status: 500 });
  }
}