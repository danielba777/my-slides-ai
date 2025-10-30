import { auth } from "@/server/auth";
import {
  getOwnedImageSetIds,
  markImageSetOwnedByUser,
  unmarkImageSetOwnedByUser,
} from "@/server/image-collection-ownership";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ownedIds: [] });
    }

    const owned = await getOwnedImageSetIds(session.user.id);
    return NextResponse.json({ ownedIds: Array.from(owned) });
  } catch (error) {
    console.error("Failed to load user image collections", error);
    // Fallback: Keine harten 500 mehr – liefere leere Liste,
    // damit die Seite weiterhin lädt und "Personal"/AI-Avatar-Logik greift.
    return NextResponse.json({ ownedIds: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      imageSetId?: string;
      name?: string | null;
      slug?: string | null;
    };

    if (!body?.imageSetId) {
      return NextResponse.json(
        { error: "imageSetId is required" },
        { status: 400 },
      );
    }

    await markImageSetOwnedByUser({
      userId: session.user.id,
      imageSetId: body.imageSetId,
      name: body.name ?? null,
      slug: body.slug ?? null,
      email: session.user.email ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark collection ownership", error);
    return NextResponse.json(
      { error: "Failed to mark collection ownership" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageSetId = searchParams.get("imageSetId");

    if (!imageSetId) {
      return NextResponse.json(
        { error: "imageSetId is required" },
        { status: 400 },
      );
    }

    await unmarkImageSetOwnedByUser({
      userId: session.user.id,
      imageSetId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unmark collection ownership", error);
    return NextResponse.json(
      { error: "Failed to unmark collection ownership" },
      { status: 500 },
    );
  }
}
