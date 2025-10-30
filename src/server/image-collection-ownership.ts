import { db } from "@/server/db";
import type { User } from "@prisma/client";

/**
 * Liefert alle ImageSet-IDs, die irgendeinem User gehören (private Collections).
 */
export async function getAllOwnedImageSetIds(): Promise<string[]> {
  const rows = await db.userImageCollection.findMany({
    select: { imageSetId: true },
  });
  return rows.map((r) => r.imageSetId);
}

/**
 * Liefert alle ImageSet-IDs, die dem angegebenen User gehören.
 */
export async function getOwnedImageSetIds(userId: string | null): Promise<string[]> {
  if (!userId) return [];
  const rows = await db.userImageCollection.findMany({
    where: { userId },
    select: { imageSetId: true },
  });
  return rows.map((r) => r.imageSetId);
}

/**
 * Markiert ein Set als private Collection eines Users (idempotent).
 */
export async function markImageSetOwnedByUser(params: {
  imageSetId: string;
  userId: string;
  email?: string | null;
  name?: string | null;
  slug?: string | null;
}) {
  const { imageSetId, userId, email, name, slug } = params;
  await db.userImageCollection.upsert({
    where: { imageSetId },
    update: { userId, email: email ?? undefined, name: name ?? undefined, slug: slug ?? undefined },
    create: {
      imageSetId,
      userId,
      email: email ?? undefined,
      name: name ?? undefined,
      slug: slug ?? undefined,
    },
  });
}

/**
 * Entfernt die Ownership-Markierung (falls je benötigt).
 */
export async function unmarkImageSetOwnedByUser(imageSetId: string) {
  await db.userImageCollection.deleteMany({ where: { imageSetId } });
}

/**
 * Hilfsfunktion im FE: annotiert ein Set mit isOwnedByUser
 */
export function annotateImageSetOwnership<T extends { id: string }>(
  set: T,
  userId: string | null,
  isOwned: boolean,
): T & { isOwnedByUser: boolean } {
  return { ...set, isOwnedByUser: Boolean(isOwned && userId) };
}

/**
 * FE-Check: gehört Set dem User?
 */
export function isImageSetOwnedByUser<T extends { id: string; isOwnedByUser?: boolean }>(
  set: T,
  _userId: string | null,
): boolean {
  return Boolean(set.isOwnedByUser);
}

export function hasPersonalCategoryTag(val?: string | null) {
  if (!val) return false;
  const s = val.toLowerCase();
  return s.includes("personal") || s.includes("private") || s.includes("my");
}