import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

type GenerationJobDto = {
  id: string;
  startedAt: string;
  expectedImages: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  errorMessage?: string | null;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${env.SLIDESCOCKPIT_API}/ai-avatars/generations/jobs`,
      {
        method: "GET",
        headers: {
          "x-user-id": session.user.id,
        },
        cache: "no-store",
      },
    );

    const data = (await response.json().catch(() => null)) as
      | GenerationJobDto[]
      | { error?: string }
      | null;

    if (!response.ok || !Array.isArray(data)) {
      return NextResponse.json(
        { error: "Failed to load generation jobs", detail: data },
        { status: response.status || 502 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[AI Avatar] Failed to load generation jobs", error);
    return NextResponse.json(
      { error: "Failed to load generation jobs" },
      { status: 500 },
    );
  }
}
