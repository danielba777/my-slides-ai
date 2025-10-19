import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

interface ScheduleRequestPayload {
  openId?: string;
  publishAt?: string;
  idempotencyKey?: string;
  post?: Record<string, unknown>;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ScheduleRequestPayload | null;
  if (
    !body ||
    typeof body.openId !== "string" ||
    typeof body.publishAt !== "string" ||
    typeof body.idempotencyKey !== "string" ||
    typeof body.post !== "object" ||
    body.post === null
  ) {
    return NextResponse.json(
      { error: "Missing openId, publishAt, idempotencyKey or post payload" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${env.SLIDESCOCKPIT_API}/integrations/social/tiktok/${encodeURIComponent(
        body.openId,
      )}/schedule`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({
          publishAt: body.publishAt,
          idempotencyKey: body.idempotencyKey,
          post: body.post,
        }),
      },
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload && typeof payload.error === "string"
          ? payload.error
          : "TikTok scheduling failed";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("TikTok scheduling request failed", error);
    return NextResponse.json({ error: "Unable to reach SlidesCockpit API" }, { status: 500 });
  }
}

