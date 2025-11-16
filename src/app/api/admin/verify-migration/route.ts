import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all avatars with their video URLs
    const avatars = await db.reactionAvatar.findMany({
      select: {
        id: true,
        name: true,
        videoUrl: true,
        thumbnailUrl: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    console.log(`[Verify] Found ${avatars.length} avatars`);

    const analysis = {
      total: avatars.length,
      active: avatars.filter(a => a.isActive).length,
      withVideos: avatars.filter(a => a.videoUrl && a.videoUrl.trim() !== "" && a.videoUrl !== "about:blank").length,
      localVideos: avatars.filter(a => a.videoUrl && a.videoUrl.includes("/reaction-hooks/")).length,
      fileserverVideos: avatars.filter(a => a.videoUrl && a.videoUrl.includes("files.slidescockpit.com")).length,
      noVideos: avatars.filter(a => !a.videoUrl || a.videoUrl.trim() === "" || a.videoUrl === "about:blank").length,
    };

    const avatarDetails = avatars.map(avatar => ({
      id: avatar.id,
      name: avatar.name,
      videoUrl: avatar.videoUrl,
      videoStatus: avatar.videoUrl && avatar.videoUrl.trim() !== "" && avatar.videoUrl !== "about:blank"
        ? (avatar.videoUrl.includes("files.slidescockpit.com") ? "FILESERVER" : "LOCAL")
        : "NONE",
      isActive: avatar.isActive,
      willShowInDashboard: avatar.isActive &&
        avatar.videoUrl &&
        avatar.videoUrl.trim() !== "" &&
        avatar.videoUrl !== "about:blank",
    }));

    console.log("[Verify] Analysis:", analysis);

    return NextResponse.json({
      success: true,
      analysis,
      avatars: avatarDetails,
      dashboardReady: {
        count: avatarDetails.filter(a => a.willShowInDashboard).length,
        avatars: avatarDetails.filter(a => a.willShowInDashboard),
      },
      recommendations: {
        success: analysis.fileserverVideos > 0,
        message: analysis.fileserverVideos === analysis.withVideos
          ? "✅ All videos migrated successfully - they will appear in Hook+Demo"
          : analysis.fileserverVideos > 0
          ? `⚠️ ${analysis.fileserverVideos} of ${analysis.withVideos} videos migrated - some still use local storage`
          : "❌ No videos found on fileserver - migration may have failed",
      }
    });

  } catch (error) {
    console.error("[Verify] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 }
    );
  }
}