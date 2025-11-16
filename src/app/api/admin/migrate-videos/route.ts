import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { existsSync, statSync } from "fs";
import path from "path";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST(req: Request) {
  console.log("[Migrate] Starting migration request...");

  const session = await auth();
  console.log("[Migrate] Session:", {
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    isAdmin: session?.user?.isAdmin,
  });

  // Check admin permissions
  const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = session?.user?.email?.toLowerCase() ?? "";
  const isAllowed = !!userEmail && allowedEmails.includes(userEmail);

  console.log("[Migrate] Admin check:", {
    userEmail,
    allowedEmails,
    isAllowed,
    isUserAdmin: session?.user?.isAdmin,
  });

  if (!session?.user?.id || (!session.user.isAdmin && !isAllowed)) {
    console.log("[Migrate] Unauthorized - missing permissions");
    return NextResponse.json({
      error: "Unauthorized",
      details: {
        hasSession: !!session?.user?.id,
        isAdmin: session?.user?.isAdmin,
        isAllowed,
        userEmail,
        allowedEmails,
      }
    }, { status: 401 });
  }

  try {
    const LOCAL_HOOKS_DIR = path.join(process.cwd(), "public", "ugc", "reaction-hooks");
    const API_BASE_URL = process.env.SLIDESCOCKPIT_API_BASE_URL ?? "http://localhost:3001";

    console.log("[Migrate] Starting video migration...");
    console.log("[Migrate] API Base URL:", API_BASE_URL);
    console.log("[Migrate] Local hooks dir:", LOCAL_HOOKS_DIR);

    // Check if directory exists
    if (!existsSync(LOCAL_HOOKS_DIR)) {
      console.log(`[Migrate] Directory not found: ${LOCAL_HOOKS_DIR}`);
      return NextResponse.json({ error: "Local hooks directory not found", path: LOCAL_HOOKS_DIR }, { status: 404 });
    }

    console.log(`[Migrate] Directory exists: ${LOCAL_HOOKS_DIR}`);

    // Get all avatars with local video URLs
    const avatars = await db.reactionAvatar.findMany({
      select: { id: true, videoUrl: true, name: true },
    });

    console.log(`[Migrate] Found ${avatars.length} avatars in database`);

    // Find local video files
    let files;
    try {
      files = await fs.readdir(LOCAL_HOOKS_DIR);
      console.log(`[Migrate] Found ${files.length} files in directory`);
    } catch (error) {
      console.error("[Migrate] Error reading directory:", error);
      return NextResponse.json({ error: "Failed to read local directory", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }

    const mp4Files = files.filter(file => file.toLowerCase().endsWith('.mp4'));
    console.log(`[Migrate] Found ${mp4Files.length} MP4 files: ${mp4Files.join(', ')}`);

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

    console.log(`[Migrate] Found ${fileNameToAvatarId.size} avatars with local videos`);

    if (fileNameToAvatarId.size === 0) {
      console.log("[Migrate] No files to migrate");
      return NextResponse.json({
        success: true,
        summary: { total: 0, successCount: 0, failureCount: 0 },
        results: [],
        message: "No local videos found to migrate."
      });
    }

    // Test API connectivity first
    try {
      const testResponse = await fetch(`${API_BASE_URL}/files/presign?key=test.txt&contentType=text/plain`, {
        method: 'GET',
      });

      if (!testResponse.ok) {
        throw new Error(`API connectivity test failed: ${testResponse.status} ${testResponse.statusText}`);
      }

      console.log("[Migrate] API connectivity test passed");
    } catch (error) {
      console.error("[Migrate] API connectivity failed:", error);
      return NextResponse.json({
        error: "API connectivity failed",
        details: error instanceof Error ? error.message : "Unknown error",
        apiUrl: API_BASE_URL
      }, { status: 500 });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const [fileName, avatarId] of fileNameToAvatarId) {
      try {
        console.log(`[Migrate] Processing ${fileName} for avatar ${avatarId}...`);

        // 1. Get presigned URL from slidescockpit-api
        const presignResponse = await fetch(`${API_BASE_URL}/files/presign?key=ugc/reaction-hooks/${fileName}&contentType=video/mp4`);

        if (!presignResponse.ok) {
          throw new Error(`Failed to get upload URL: ${presignResponse.status} ${presignResponse.statusText}`);
        }

        const presignData = await presignResponse.json();
        if (!presignData.uploadUrl) {
          throw new Error("No upload URL received");
        }

        // 2. Read local video file
        const filePath = path.join(LOCAL_HOOKS_DIR, fileName);

        // Check file existence first
        if (!existsSync(filePath)) {
          throw new Error(`File not found: ${fileName}`);
        }

        let fileStats;
        let videoBuffer;

        try {
          fileStats = statSync(filePath);
          videoBuffer = await fs.readFile(filePath);
        } catch (error) {
          throw new Error(`Failed to read file ${fileName}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }

        console.log(`[Migrate] Uploading ${fileName} (${(fileStats.size / 1024 / 1024).toFixed(1)} MB)...`);

        // 3. Upload to S3 with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const uploadResponse = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "video/mp4",
          },
          body: videoBuffer,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        // 4. Update database with new URL
        const newVideoUrl = presignData.publicUrl;
        await db.reactionAvatar.update({
          where: { id: avatarId },
          data: { videoUrl: newVideoUrl },
        });

        console.log(`[Migrate] ✅ ${fileName} migrated successfully`);

        results.push({
          fileName,
          avatarId,
          oldUrl: `/ugc/reaction-hooks/${fileName}`,
          newUrl: newVideoUrl,
          size: fileStats.size,
          sizeMB: (fileStats.size / 1024 / 1024).toFixed(1),
          status: "success"
        });

        successCount++;

      } catch (error) {
        console.error(`[Migrate] ❌ Failed to migrate ${fileName}:`, error);
        results.push({
          fileName,
          avatarId,
          error: error instanceof Error ? error.message : "Unknown error",
          status: "failed"
        });
        failureCount++;
      }
    }

    console.log(`[Migrate] Migration completed: ${successCount} success, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      summary: {
        total: fileNameToAvatarId.size,
        successCount,
        failureCount
      },
      results,
      message: failureCount === 0
        ? "All videos migrated successfully!"
        : `${successCount} videos migrated, ${failureCount} failed. Check results for details.`
    });

  } catch (error) {
    console.error("[Migrate Videos] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 }
    );
  }
}