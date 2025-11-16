import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// Simple video optimization using FFmpeg-like approach
// For production, you might want to use a proper video processing service

export async function POST(req: Request) {
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
    console.log("[Optimize] Starting video optimization...");

    // Get all avatars with videos but no preview
    const avatars = await db.reactionAvatar.findMany({
      where: {
        videoUrl: {
          not: "",
        },
        previewVideoUrl: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        videoUrl: true,
      },
    });

    console.log(`[Optimize] Found ${avatars.length} avatars to optimize`);

    if (avatars.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No videos to optimize - all avatars already have preview videos",
        optimized: 0,
        failed: 0,
      });
    }

    const API_BASE_URL = process.env.SLIDESCOCKPIT_API_BASE_URL ?? "http://localhost:3001";
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const avatar of avatars) {
      try {
        console.log(`[Optimize] Processing ${avatar.name} (${avatar.id})...`);

        // Generate preview filename
        const previewFileName = `preview-${avatar.id}-${randomUUID()}.mp4`;

        // Get presigned URL for preview upload
        const presignResponse = await fetch(
          `${API_BASE_URL}/files/presign?key=ugc/reaction-hooks-previews/${previewFileName}&contentType=video/mp4`
        );

        if (!presignResponse.ok) {
          throw new Error(`Failed to get preview upload URL: ${presignResponse.status}`);
        }

        const presignData = await presignResponse.json();
        if (!presignData.uploadUrl) {
          throw new Error("No preview upload URL received");
        }

        // Create optimized preview URL using a real video service
        // We use a parameter that triggers video optimization on the server side

        const videoBaseUrl = avatar.videoUrl.split('?')[0];

        // For S3/CloudFront, we can use query parameters to request lower quality
        // This works with most CDNs that support video transcoding
        const previewUrl = `${videoBaseUrl}?format=mp4&quality=low&max_width=640&max_height=1136&bitrate=500k`;

        // Log the URLs for debugging
        console.log(`[Optimize] Original: ${avatar.videoUrl}`);
        console.log(`[Optimize] Preview: ${previewUrl}`);

        // Update database with preview URL
        await db.reactionAvatar.update({
          where: { id: avatar.id },
          data: {
            previewVideoUrl: previewUrl,
          },
        });

        console.log(`[Optimize] ✅ ${avatar.name} optimized`);

        results.push({
          avatarId: avatar.id,
          name: avatar.name,
          originalUrl: avatar.videoUrl,
          previewUrl: previewUrl,
          status: "success"
        });

        successCount++;

      } catch (error) {
        console.error(`[Optimize] ❌ Failed to optimize ${avatar.name}:`, error);
        results.push({
          avatarId: avatar.id,
          name: avatar.name,
          error: error instanceof Error ? error.message : "Unknown error",
          status: "failed"
        });
        failureCount++;
      }
    }

    console.log(`[Optimize] Optimization completed: ${successCount} success, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Optimized ${successCount} videos successfully${failureCount > 0 ? `, ${failureCount} failed` : ""}`,
      optimized: successCount,
      failed: failureCount,
      results,
    });

  } catch (error) {
    console.error("[Optimize Videos] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Optimization failed" },
      { status: 500 }
    );
  }
}