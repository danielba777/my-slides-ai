import { env } from "@/env";
import { applyPostizCookies } from "@/lib/postiz-session";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = await fetch(`${env.POSTIZ_API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: env.POSTIZ_EMAIL,
        password: env.POSTIZ_PASSWORD,
        provider: env.POSTIZ_PROVIDER,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const errorResponse = NextResponse.json(
        {
          error:
            typeof data === "object" && data && "message" in data
              ? (data as { message: string }).message
              : "Failed to login with Postiz",
        },
        { status: response.status },
      );
      applyPostizCookies(errorResponse, response);
      return errorResponse;
    }

    const successResponse = NextResponse.json(
      {
        status: "ok",
        user: data,
      },
      { status: response.status },
    );
    applyPostizCookies(successResponse, response);
    return successResponse;
  } catch (error) {
    console.error("Failed to login to Postiz", error);
    return NextResponse.json(
      { error: "Unable to reach Postiz API" },
      { status: 500 },
    );
  }
}
