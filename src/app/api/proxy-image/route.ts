import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // schnell & cachebar

export async function GET(req: NextRequest) {
const url = req.nextUrl.searchParams.get("url");
if (!url) {
return new NextResponse("Missing url", { status: 400 });
}

try {
// Serverseitiges Fetch ohne CORS-Probleme im Browser
const resp = await fetch(url, {
// Keine Credentials weiterreichen
redirect: "follow",
// Bei Bedarf: timeout via AbortController (weggelassen für Kürze)
});

if (!resp.ok || !resp.body) {
  return new NextResponse("Upstream fetch failed", { status: 502 });
}

// Content-Type vom Upstream übernehmen, damit <img> sauber rendert
const contentType = resp.headers.get("content-type") ?? "image/octet-stream";

// Browser-seitig unkritisch, aber explizit erlauben:
const headers = new Headers({
  "Content-Type": contentType,
  "Cache-Control": "public, max-age=86400, immutable",
  "Access-Control-Allow-Origin": "*",
});

return new NextResponse(resp.body, { status: 200, headers });
} catch {
return new NextResponse("Proxy error", { status: 500 });
}
}