import { env } from "@/env";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "postiz_session";

function encodeCookieValue(raw: string) {
  return Buffer.from(raw, "utf8").toString("base64");
}

function decodeCookieValue(encoded: string) {
  return Buffer.from(encoded, "base64").toString("utf8");
}

function extractUpstreamCookie(response: Response) {
  const maybeGetSetCookie = (response.headers as unknown as {
    getSetCookie?: () => string[];
  }).getSetCookie;
  const setCookies = maybeGetSetCookie?.call(response.headers) ?? [];

  if (setCookies.length === 0) {
    return undefined;
  }

  const cookieHeader = setCookies
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");

  return cookieHeader.length > 0 ? cookieHeader : undefined;
}

export async function readPostizCookieHeader() {
  const store = await cookies();
  const stored = store.get(SESSION_COOKIE_NAME);
  if (!stored?.value) {
    return undefined;
  }

  try {
    return decodeCookieValue(stored.value);
  } catch {
    return undefined;
  }
}

export async function ensurePostizCookie() {
  const header = await readPostizCookieHeader();
  if (!header) {
    throw new Error("missing-postiz-session");
  }
  return header;
}

export function applyPostizCookies(nextResponse: NextResponse, upstream: Response) {
  const cookieHeader = extractUpstreamCookie(upstream);
  if (!cookieHeader) {
    return;
  }

  nextResponse.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: encodeCookieValue(cookieHeader),
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}
