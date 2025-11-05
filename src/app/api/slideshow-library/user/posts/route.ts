import { NextResponse } from "next/server";

import { auth } from "@/server/auth";

const API_BASE_URL =
  process.env.SLIDESCOCKPIT_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");
  const requestUrl = new URL(
    `${API_BASE_URL}/slideshow-library/users/${session.user.id}/posts`,
  );
  if (limit) {
    requestUrl.searchParams.set("limit", limit);
  }

  try {
    const response = await fetch(requestUrl.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: "Failed to fetch user posts" }));
      return NextResponse.json(
        {
          error:
            typeof (errorBody as any)?.error === "string"
              ? errorBody.error
              : "Failed to load user posts",
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[slideshow-library][user/posts] Fetch failed", error);
    return NextResponse.json(
      { error: "Failed to load user posts" },
      { status: 500 },
    );
  }
}
