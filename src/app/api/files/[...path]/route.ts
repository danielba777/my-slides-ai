import { NextRequest, NextResponse } from "next/server";

const FILES_BASE_URL =
  process.env.NEXT_PUBLIC_SLIDESCOCKPIT_FILES_BASE ??
  "https://files.slidescockpit.com";

function createUpstreamUrl(pathSegments: string[]): string {
  const joined = pathSegments.map(encodeURIComponent).join("/");
  return `${FILES_BASE_URL.replace(/\/+$/, "")}/${joined}`;
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
): Promise<NextResponse> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405, headers: { "Allow": "GET, HEAD" } },
    );
  }

  const upstreamUrl = createUpstreamUrl(path);
  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: {
      Accept: request.headers.get("Accept") ?? "*/*",
    },
  }).catch((error: unknown) => {
    console.error("Files proxy fetch failed:", error);
    return null;
  });

  if (!upstreamResponse) {
    return NextResponse.json(
      { error: "Unable to reach upstream files service" },
      { status: 502 },
    );
  }

  if (!upstreamResponse.ok) {
    const status = upstreamResponse.status || 502;
    return NextResponse.json(
      { error: `Upstream responded with status ${status}` },
      { status },
    );
  }

  if (request.method === "HEAD") {
    return new NextResponse(null, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type":
          upstreamResponse.headers.get("Content-Type") ??
          "application/octet-stream",
        "Cache-Control":
          upstreamResponse.headers.get("Cache-Control") ??
          "public, max-age=60, s-maxage=120",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (!upstreamResponse.body) {
    return NextResponse.json(
      { error: "Upstream response had no body" },
      { status: 502 },
    );
  }

  const response = new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: {
      "Content-Type":
        upstreamResponse.headers.get("Content-Type") ??
        "application/octet-stream",
      "Cache-Control":
        upstreamResponse.headers.get("Cache-Control") ??
        "public, max-age=60, s-maxage=120",
      "Access-Control-Allow-Origin": "*",
    },
  });

  return response;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}
