import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const avatars = await db.reactionAvatar.findMany({
      select: {
        id: true,
        name: true,
        videoUrl: true,
        isActive: true,
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      avatars: avatars.map(a => ({
        id: a.id,
        name: a.name,
        videoUrl: a.videoUrl,
        isLocal: a.videoUrl?.startsWith('/ugc/reaction-hooks/'),
        isExternal: a.videoUrl?.startsWith('http'),
        isActive: a.isActive,
        urlStatus: a.videoUrl ? (a.videoUrl.startsWith('/ugc/reaction-hooks/') ? 'LOCAL_FILE' : 'EXTERNAL_URL') : 'NO_URL'
      }))
    });
  } catch (error) {
    console.error("[Debug] Failed to fetch avatars", error);
    return NextResponse.json(
      { error: "Failed to load reaction avatars" },
      { status: 500 },
    );
  }
}