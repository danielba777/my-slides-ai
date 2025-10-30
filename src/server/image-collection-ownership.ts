import { db } from "@/server/db";
import { randomUUID } from "crypto";

type OwnedRow = { imageSetId: string };

/**
 * Stellt sicher, dass die Tabelle "UserImageCollection" existiert.
 * WICHTIG: DDL-Befehle einzeln ausführen (keine Multi-Statements).
 */
async function ensureOwnershipTable() {
  // 1) Tabelle anlegen (falls nicht vorhanden)
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserImageCollection" (
      "id" UUID PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "imageSetId" TEXT NOT NULL UNIQUE,
      "name" TEXT,
      "slug" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // 2) Index separat anlegen
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "idx_user_image_collection_user"
      ON "UserImageCollection" ("userId")
  `);

  // 3) Spalte email hinzufügen (idempotent)
  await db.$executeRawUnsafe(`
    ALTER TABLE "UserImageCollection"
    ADD COLUMN IF NOT EXISTS "email" TEXT
  `);
}

function isMissingRelationError(err: unknown): boolean {
  // Prisma KnownRequestError -> P2010 mit Postgres Code 42P01 ("relation does not exist")
  const anyErr = err as { code?: string; meta?: any; message?: string };
  return (
    (anyErr?.code === "P2010" && String(anyErr?.message || "").includes("42P01")) ||
    String(anyErr?.message || "").includes('relation "UserImageCollection" does not exist')
  );
}

export async function getOwnedImageSetIds(
  userId: string,
): Promise<Set<string>> {
  try {
    const rows =
      (await db.$queryRaw<OwnedRow[]>`
        SELECT "imageSetId"
        FROM "UserImageCollection"
        WHERE "userId" = ${userId}
      `) ?? [];
    return new Set(rows.map((row) => row.imageSetId));
  } catch (err) {
    if (isMissingRelationError(err)) {
      await ensureOwnershipTable();
      // nach Anlegen einmal erneut versuchen
      const rows =
        (await db.$queryRaw<OwnedRow[]>`
          SELECT "imageSetId"
          FROM "UserImageCollection"
          WHERE "userId" = ${userId}
        `) ?? [];
      return new Set(rows.map((row) => row.imageSetId));
    }
    throw err;
  }
}

export async function isImageSetOwnedByUser(
  userId: string,
  imageSetId: string,
): Promise<boolean> {
  try {
    const rows =
      (await db.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS(
          SELECT 1 FROM "UserImageCollection"
          WHERE "userId" = ${userId} AND "imageSetId" = ${imageSetId}
        ) AS "exists"
      `) ?? [];
    return rows.length > 0 && Boolean(rows[0]?.exists);
  } catch (err) {
    if (isMissingRelationError(err)) {
      await ensureOwnershipTable();
      const rows =
        (await db.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS(
            SELECT 1 FROM "UserImageCollection"
            WHERE "userId" = ${userId} AND "imageSetId" = ${imageSetId}
          ) AS "exists"
        `) ?? [];
      return rows.length > 0 && Boolean(rows[0]?.exists);
    }
    throw err;
  }
}

export async function markImageSetOwnedByUser(options: {
  userId: string;
  imageSetId: string;
  name?: string | null;
  slug?: string | null;
  email?: string | null;
}) {
  await ensureOwnershipTable();
  const { userId, imageSetId, name = null, slug = null, email = null } = options;
  // Upsert: falls (imageSetId) schon existiert, aktualisiere Metadaten + Email
  await db.$executeRawUnsafe(
    `
INSERT INTO "UserImageCollection" ("id","userId","imageSetId","name","slug","email")
VALUES ($1,$2,$3,$4,$5,$6)
ON CONFLICT ("imageSetId")
DO UPDATE SET
     "userId" = EXCLUDED."userId",
     "name" = EXCLUDED."name",
     "slug" = EXCLUDED."slug",
     "email" = EXCLUDED."email",
     "updatedAt" = NOW()
`,
    randomUUID(),
    userId,
    imageSetId,
    name,
    slug,
    email
  );
}

export async function unmarkImageSetOwnedByUser(options: {
  userId: string;
  imageSetId: string;
}) {
  const { userId, imageSetId } = options;
  try {
    await db.$executeRaw`
      DELETE FROM "UserImageCollection"
      WHERE "userId" = ${userId} AND "imageSetId" = ${imageSetId}
    `;
  } catch (err) {
    if (isMissingRelationError(err)) {
      await ensureOwnershipTable();
      await db.$executeRaw`
        DELETE FROM "UserImageCollection"
        WHERE "userId" = ${userId} AND "imageSetId" = ${imageSetId}
      `;
    } else {
      throw err;
    }
  }
}

export async function getAllImageSetOwnersWithEmail() {
  await ensureOwnershipTable();
  const rows = await db.$queryRawUnsafe<{ imageSetId: string; userId: string; email: string | null }[]>(
    `SELECT "imageSetId","userId","email" FROM "UserImageCollection"`
  );
  return rows;
}
