import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { openId: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { openId } = params;

  try {
    const response = await fetch(
      `${env.SLIDESCOCKPIT_API}/integrations/social/tiktok/${encodeURIComponent(openId)}/disconnect`,
      {
        method: "DELETE",
        headers: {
          "x-user-id": session.user.id,
        },
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            typeof data === "object" && data && "error" in data
              ? (data as { error: string }).error
              : typeof data === "object" && data && "message" in data
              ? (data as { message: string }).message
              : "Failed to disconnect TikTok account",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Failed to disconnect TikTok account", error);
    return NextResponse.json(
      { error: "Unable to reach SlidesCockpit API" },
      { status: 500 },
    );
  }
}