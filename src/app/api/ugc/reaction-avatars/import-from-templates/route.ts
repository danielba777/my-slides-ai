import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/server/auth";
import { db } from "@/server/db";

type Template = {
  id: string;
  name?: string | null;
  title?: string | null;
  prompt?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  previewVideoUrl?: string | null;
};

const deriveName = (template: Template): string => {
  const raw =
    template.name ??
    template.title ??
    (template.prompt ? template.prompt.replace(/\s+/g, " ").trim() : null);

  if (raw && raw.length > 0) {
    return raw.length > 80 ? `${raw.slice(0, 77).trimEnd()}...` : raw;
  }

  return `Template ${template.id.slice(0, 8)}`;
};

const deriveDescription = (template: Template): string | null => {
  const raw =
    template.description ??
    (template.prompt ? template.prompt.replace(/\s+/g, " ").trim() : null);

  if (!raw || raw.length === 0) {
    return null;
  }

  return raw.length > 200 ? `${raw.slice(0, 197).trimEnd()}...` : raw;
};

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Allow list for admin UI access: ADMIN_ALLOWED_EMAILS="email1,email2"
  const allowed = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const email = session.user.email?.toLowerCase() ?? "";
  if (!email || !allowed.includes(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hdrs = await headers();
    const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
    const proto = hdrs.get("x-forwarded-proto") ?? "http";

    if (!host) {
      return NextResponse.json(
        { error: "Host header missing" },
        { status: 500 },
      );
    }

    const baseUrl = `${proto}://${host}`;
    const res = await fetch(`${baseUrl}/api/ai-avatars/templates`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to load AI avatar templates", detail },
        { status: res.status },
      );
    }

    const templates = (await res.json()) as Template[] | { data?: Template[] };
    const list: Template[] = Array.isArray(templates)
      ? templates
      : Array.isArray(templates?.data)
      ? templates.data
      : [];

    if (!list.length) {
      return NextResponse.json({
        imported: 0,
        skipped: 0,
        message: "No templates found",
      });
    }

    const orderAggregate = await db.reactionAvatar.aggregate({
      _max: { order: true },
    });
    let nextOrder = (orderAggregate._max.order ?? -1) + 1;

    let imported = 0;
    let skipped = 0;

    for (const template of list) {
      const name = deriveName(template);
      const thumbnail = (template.thumbnailUrl ?? template.imageUrl ?? "").trim();

      if (!thumbnail) {
        skipped += 1;
        continue;
      }

      const existing = await db.reactionAvatar.findFirst({
        where: { name, thumbnailUrl: thumbnail },
        select: { id: true },
      });

      if (existing) {
        skipped += 1;
        continue;
      }

      await db.reactionAvatar.create({
        data: {
          name,
          description: deriveDescription(template),
          thumbnailUrl: thumbnail,
          videoUrl: template.previewVideoUrl?.trim() || "about:blank",
          order: nextOrder,
          isActive: true,
          createdById: session.user.id,
        },
      });

      imported += 1;
      nextOrder += 1;
    }

    return NextResponse.json({ imported, skipped });
  } catch (error) {
    console.error("[UGC][ImportFromTemplates][POST]", error);
    return NextResponse.json(
      { error: "Failed to import templates" },
      { status: 500 },
    );
  }
}
