import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
const url = req.nextUrl.searchParams.get("url");
if (!url) {
return new NextResponse("Missing url", { status: 400 });
}

try {
const resp = await fetch(url, {
redirect: "follow",
});

if (!resp.ok || !resp.body) {
  return new NextResponse("Upstream fetch failed", { status: 502 });
}

const contentType = resp.headers.get("content-type") ?? "image/octet-stream";

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