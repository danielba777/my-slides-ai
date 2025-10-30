Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/server/image-collection-ownership.ts
@@
-import { db } from "@/server/db";
-import { randomUUID } from "crypto";

- -type OwnedRow = { imageSetId: string };
- -/\*\*
- - Stellt sicher, dass die Tabelle "UserImageCollection" existiert.
- - Wird idempotent aufgerufen (CREATE TABLE IF NOT EXISTS).
- \*/
  -async function ensureOwnershipTable() {
- // Tabelle + Indexe nur anlegen, wenn sie fehlen
- await db.$executeRawUnsafe(`
- CREATE TABLE IF NOT EXISTS "UserImageCollection" (
-      "id" UUID PRIMARY KEY,
-      "userId" TEXT NOT NULL,
-      "imageSetId" TEXT NOT NULL UNIQUE,
-      "name" TEXT,
-      "slug" TEXT,
-      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
-      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
- );
- CREATE INDEX IF NOT EXISTS "idx_user_image_collection_user"
-      ON "UserImageCollection" ("userId");
- `);
  -}
  +import { db } from "@/server/db";
  +import { randomUUID } from "crypto";

* +type OwnedRow = { imageSetId: string };
* +/\*\*
* - Stellt sicher, dass die Tabelle "UserImageCollection" existiert.
* - WICHTIG: DDL-Befehle einzeln ausführen (keine Multi-Statements).
* \*/
  +async function ensureOwnershipTable() {
* // 1) Tabelle anlegen (falls nicht vorhanden)
* await db.$executeRawUnsafe(`
* CREATE TABLE IF NOT EXISTS "UserImageCollection" (
*      "id" UUID PRIMARY KEY,
*      "userId" TEXT NOT NULL,
*      "imageSetId" TEXT NOT NULL UNIQUE,
*      "name" TEXT,
*      "slug" TEXT,
*      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
*      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
* )
* `);
*
* // 2) Index separat anlegen
* await db.$executeRawUnsafe(`
* CREATE INDEX IF NOT EXISTS "idx_user_image_collection_user"
*      ON "UserImageCollection" ("userId")
* `);
*
* // 3) Spalte email hinzufügen (idempotent)
* await db.$executeRawUnsafe(`
* ALTER TABLE "UserImageCollection"
* ADD COLUMN IF NOT EXISTS "email" TEXT
* `);
  +}
  @@
  export async function getOwnedImageSetIds(
  userId: string,
  ): Promise<Set<string>> {
  \*\*\* End Patch

codebase

diff
Code kopieren
**_ Begin Patch
_** Update File: src/server/image-collection-ownership.ts
@@
-export async function markImageSetOwnedByUser(options: {

- userId: string;
- imageSetId: string;
- name?: string | null;
- slug?
  +export async function markImageSetOwnedByUser(options: {

* userId: string;
* imageSetId: string;
* name?: string | null;
* slug?: string | null;
* email?: string | null;
  }) {

- // ... (Rest der Funktion, hier nicht im Auszug sichtbar)

* await ensureOwnershipTable();
* const { userId, imageSetId, name = null, slug = null, email = null } = options;
* // Upsert: falls (imageSetId) schon existiert, aktualisiere Metadaten + Email
* await db.$executeRawUnsafe(
* `
* INSERT INTO "UserImageCollection" ("id","userId","imageSetId","name","slug","email")
* VALUES ($1,$2,$3,$4,$5,$6)
* ON CONFLICT ("imageSetId")
* DO UPDATE SET
*      "userId" = EXCLUDED."userId",
*      "name" = EXCLUDED."name",
*      "slug" = EXCLUDED."slug",
*      "email" = EXCLUDED."email",
*      "updatedAt" = NOW()
* `,
* randomUUID(),
* userId,
* imageSetId,
* name,
* slug,
* email
* );
  }
  \*\*\* End Patch

codebase

Hinweis: Deine Datei enthielt in ensureOwnershipTable Multi-Statements; genau das verursacht den 42601-Fehler. Jetzt laufen DDLs einzeln. Außerdem wird email ab jetzt persistiert (Fix für 42703).

diff
Code kopieren
**_ Begin Patch
_** Update File: src/app/api/user-image-collections/route.ts
@@

- await markImageSetOwnedByUser({

* await markImageSetOwnedByUser({
  userId: session.user.id,
  imageSetId: body.imageSetId,
  name: body.name ?? null,

-      slug: body.slug ?? null,

*      slug: body.slug ?? null,
*      email: session.user.email ?? null,
       });
  \*\*\* End Patch

codebase

Admin: Persönliche/owned Sets konsequent aus „Imagesets“ rausfiltern
Owned-IDs im Admin laden (neue API) und ausblenden.

Fix für den kaputten Spread { .set, ... } → muss { ...set, ... } sein.

diff
Code kopieren
**_ Begin Patch
_** Update File: src/app/admin/slideshows/imagesets/page.tsx
@@
-import { hasPersonalCategoryTag } from "@/lib/image-set-ownership";
+import { hasPersonalCategoryTag } from "@/lib/image-set-ownership";
+import { useMemo } from "react";
@@
-function removePersonalCollections(sets: ImageSet[] | undefined): ImageSet[] {
+function removePersonalCollections(sets: ImageSet[] | undefined): ImageSet[] {
if (!Array.isArray(sets)) {
return [];
}
@@

- filtered.push(
-      nextChildren && nextChildren.length > 0
-        ? { .set, children: nextChildren }
-        : { .set, children: nextChildren },
- );

* filtered.push(
*      nextChildren && nextChildren.length > 0
*        ? { ...set, children: nextChildren }
*        : { ...set, children: nextChildren },
* );
  }

return filtered;
}

export default function ImageSetsAdminPage() {
const router = useRouter();
const [imageSets, setImageSets] = useState<ImageSet[]>([]);
const [isCreating, setIsCreating] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [parentForNew, setParentForNew] = useState<string | null>(null);

- const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
-
- // Owned IDs (aller Nutzer) laden – damit blenden wir personal/owned Sets IMMER aus.
- useEffect(() => {
- (async () => {
-      try {
-        const res = await fetch("/api/admin/user-image-collections", { cache: "no-store" });
-        if (!res.ok) return;
-        const list = (await res.json()) as Array<{ imageSetId: string }>;
-        setOwnedIds(new Set(list.map((r) => r.imageSetId)));
-      } catch {}
- })();
- }, []);
  @@
  useEffect(() => {
  (async () => {
  try {
  setIsLoading(true);
  const res = await fetch("/api/imagesets", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load image sets");
  const json = (await res.json()) as ImageSet[];

*        const cleaned = removePersonalCollections(json);
*        setImageSets(cleaned);

-        // 1) alles ohne "personal"-Tag
-        let cleaned = removePersonalCollections(json);
-        // 2) owned IDs zusätzlich global ausblenden (falls ohne Tag)
-        if (ownedIds.size > 0) {
-          const filterOwned = (sets: ImageSet[]): ImageSet[] =>
-            sets
-              .filter((s) => !ownedIds.has(s.id))
-              .map((s) => ({
-                ...s,
-                children: Array.isArray(s.children) ? filterOwned(s.children) : [],
-              }));
-          cleaned = filterOwned(cleaned);
-        }
-        setImageSets(cleaned);
       } catch (e) {
         console.error(e);
         toast.error("Fehler beim Laden der Imagesets");
       } finally {
         setIsLoading(false);
       }
  })();

* }, []);

- }, [ownedIds]);
  \*\*\* End Patch

codebase

Neue Admin-API: /api/admin/user-image-collections
Damit holt der Admin eine Liste aller owned Sets (inkl. Email – du kannst das später in der UI verwenden).

diff
Code kopieren
**_ Begin Patch
_** Add File: src/app/api/admin/user-image-collections/route.ts
+import { NextResponse } from "next/server";
+import { auth } from "@/server/auth";
+import { db } from "@/server/db";

- +export async function GET() {
- const session = await auth();
- // Simple Gate – passe ggf. an deine Admin-Logik an:
- if (!session?.user?.email) {
- return NextResponse.json([], { status: 200 });
- }
- try {
- // E-Mail kann null sein, wenn früher ohne E-Mail gespeichert
- const rows = await db.$queryRawUnsafe<
-      Array<{ imageSetId: string; userId: string; email: string | null }>
- > (`SELECT "imageSetId","userId","email" FROM "UserImageCollection"`);
- return NextResponse.json(rows, { status: 200 });
- } catch {
- return NextResponse.json([], { status: 200 });
- }
  +}
  \*\*\* End Patch
