import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
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
    console.log("[Preview Debug] Checking video optimization status...");

    // Get all avatars with videos
    const avatars = await db.reactionAvatar.findMany({
      where: {
        videoUrl: {
          not: "",
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        videoUrl: true,
        previewVideoUrl: true,
      },
    });

    console.log(`[Preview Debug] Found ${avatars.length} total avatars with videos`);

    const results = avatars.map(avatar => ({
      id: avatar.id,
      name: avatar.name,
      hasOriginal: !!avatar.videoUrl,
      hasPreview: !!avatar.previewVideoUrl,
      originalUrl: avatar.videoUrl,
      previewUrl: avatar.previewVideoUrl,
      originalLength: avatar.videoUrl?.length || 0,
      previewLength: avatar.previewVideoUrl?.length || 0,
    }));

    const avatarsWithPreview = results.filter(r => r.hasPreview);
    const avatarsWithoutPreview = results.filter(r => !r.hasPreview && r.hasOriginal);

    return NextResponse.json({
      success: true,
      summary: {
        total: avatars.length,
        withPreview: avatarsWithPreview.length,
        withoutPreview: avatarsWithoutPreview.length,
      },
      avatars: results,
    });

  } catch (error) {
    console.error("[Preview Debug] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Debug failed" },
      { status: 500 }
    );
  }
}