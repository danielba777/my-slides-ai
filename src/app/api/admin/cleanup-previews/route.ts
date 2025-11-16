import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST() {
  const session = await auth();
  const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const userEmail = session?.user?.email?.toLowerCase() ?? "";
  const isAllowed = !!userEmail && allowedEmails.includes(userEmail);

  if (!session?.user?.id || (!session.user.isAdmin && !isAllowed)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cleanup] Removing preview video URLs from database...");

    // Remove all previewVideoUrl entries since we now use dynamic optimization
    const result = await db.reactionAvatar.updateMany({
      where: {
        previewVideoUrl: {
          not: null,
        },
      },
      data: {
        previewVideoUrl: null,
      },
    });

    console.log(`[Cleanup] Removed preview URLs from ${result.count} avatars`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.count} preview video URLs. The system now uses dynamic optimization.`,
      cleaned: result.count,
    });

  } catch (error) {
    console.error("[Cleanup Previews] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}