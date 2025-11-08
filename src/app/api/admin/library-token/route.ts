import { NextResponse } from "next/server";

import { db } from "@/server/db";

const ADMIN_LIBRARY_TOKEN = process.env.ADMIN_LIBRARY_TOKEN;

if (!ADMIN_LIBRARY_TOKEN) {
  throw new Error("ADMIN_LIBRARY_TOKEN is not set");
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    if (token === ADMIN_LIBRARY_TOKEN) {
      return NextResponse.json({
        isValid: true,
        message: "Admin library token is valid"
      });
    } else {
      return NextResponse.json({
        isValid: false,
        message: "Invalid admin library token"
      });
    }
  } catch (error) {
    console.error("[admin/library-token] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}