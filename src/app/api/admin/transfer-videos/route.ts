import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const LOCAL_HOOKS_DIR = path.join(process.cwd(), "public", "ugc", "reaction-hooks");

    // Check if directory exists
    if (!fs.existsSync(LOCAL_HOOKS_DIR)) {
      return NextResponse.json({ error: "Local hooks directory not found" }, { status: 404 });
    }

    // Get all avatars
    const avatars = await db.reactionAvatar.findMany({
      select: { id: true, videoUrl: true },
    });

    // Find local video files
    const files = await fs.readdir(LOCAL_HOOKS_DIR);
    const mp4Files = files.filter(file => file.endsWith('.mp4'));

    // Map filenames to avatar IDs
    const fileNameToAvatarId = new Map();
    avatars.forEach(avatar => {
      if (avatar.videoUrl && avatar.videoUrl.includes('/reaction-hooks/')) {
        const fileName = avatar.videoUrl.split('/').pop();
        if (fileName && mp4Files.includes(fileName)) {
          fileNameToAvatarId.set(fileName, avatar.id);
        }
      }
    });

    const results = [];

    for (const [fileName, avatarId] of fileNameToAvatarId) {
      const filePath = path.join(LOCAL_HOOKS_DIR, fileName);
      const fileStats = await fs.stat(filePath);

      results.push({
        fileName,
        avatarId,
        size: fileStats.size,
        sizeMB: (fileStats.size / 1024 / 1024).toFixed(1),
        message: "Ready for manual upload via Admin Panel"
      });
    }

    return NextResponse.json({
      success: true,
      totalFiles: results.length,
      files: results,
      instructions: {
        step1: "Upload these files to https://files.slidescockpit.com/ugc/reaction-hooks/",
        step2: "Update the videoUrl in the database to: https://files.slidescockpit.com/ugc/reaction-hooks/[filename]",
        step3: "Or use the Admin Panel to regenerate videos (will upload to fileserver automatically)"
      }
    });

  } catch (error) {
    console.error("[Transfer Videos] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transfer failed" },
      { status: 500 }
    );
  }
}