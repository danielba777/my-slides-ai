Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/app/admin/slideshows/imagesets/page.tsx
@@
interface ImageSet {
id: string;
name: string;
slug: string;
isActive: boolean;
createdAt: string;
parentId?: string | null;
children?: ImageSet[];
\_count: { images: number; children?: number };
category?: string | null;
}

-function removePersonalCollections(sets: ImageSet[] | undefined): ImageSet[] {
+function removePersonalCollections(sets: ImageSet[] | undefined): ImageSet[] {
if (!Array.isArray(sets)) {
return [];
}

const filtered: ImageSet[] = [];

for (const set of sets) {

- const category = set.category?.toLowerCase();
-
- // In der Community-Ansicht wollen wir _keine_ kundenseitigen Sets sehen:
- // alles ausblenden, was als "personal|mine|user" markiert ist.
- if (category === "personal" || category === "mine" || category === "user") {

* const category = (set.category ?? "").toLowerCase();
* // Community-Ansicht: ausschließlich Community zeigen
* // => alle user-erstellten Kategorien verbergen
* if (category === "personal" || category === "mine" || category === "user") {
  continue;
  }

  let nextChildren: ImageSet[] | undefined;
  if (Array.isArray(set.children) && set.children.length > 0) {
  nextChildren = removePersonalCollections(set.children);
  }

  filtered.push(

-      nextChildren && nextChildren.length > 0
-        ? { .set, children: nextChildren }
-        : { .set, children: nextChildren },

*      nextChildren && nextChildren.length > 0
*        ? { ...set, children: nextChildren }
*        : { ...set, children: nextChildren },
      );

  }

  return filtered;
  }

export default function ImageSetsAdminPage() {
const router = useRouter();
const [imageSets, setImageSets] = useState<ImageSet[]>([]);
const [isCreating, setIsCreating] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [parentForNew, setParentForNew] = useState<string | null>(null);
@@

- const loadImageSets = async () => {

* const loadImageSets = async () => {
  try {
  setIsLoading(true);
  const response = await fetch("/api/imagesets", { cache: "no-store" });
  if (!response.ok) {
  throw new Error("Failed to fetch image sets");
  }

-      const data = (await response.json()) as ImageSet[];
-      setImageSets(data);

*      const data = (await response.json()) as ImageSet[];
*      // Wichtig: Im „Imagesets“-Bereich nur Community anzeigen – Personal rausfiltern
*      setImageSets(removePersonalCollections(data));
       } catch (error) {
         console.error("Error loading image sets:", error);
       } finally {
         setIsLoading(false);
       }
  };
  \*\*\* End Patch
  Hinweis: Das entfernt nur die Anzeige; es ändert nichts in der DB/Backend-Kategorie der Sets. (Siehe Admin-Datei in deinem Repo, an der diese Funktion bereits existiert. Wir rufen sie jetzt konsequent nach dem Fetch auf. Quelle der Funktion im Code: Admin-Imagesets Page
  codebase

/ frühere Patch-Spuren
codebase

.)

diff
Code kopieren
**_ Begin Patch
_** Update File: src/app/dashboard/image-collections/page.tsx
@@
async function loadSets() {
try {
setLoading(true);

-      const [setsRes, ownedRes] = await Promise.all([

*      const [setsRes, ownedRes] = await Promise.all([
         fetch("/api/imagesets", { cache: "no-store" }),
         fetch("/api/user-image-collections", { cache: "no-store" }),
       ]);

       if (!setsRes.ok) {
         throw new Error("Failed to load image collections");
       }

-      const data = (await setsRes.json()) as ImageSet[] | null;

*      const data = (await setsRes.json()) as ImageSet[] | null;
       const ownedPayload = ownedRes.ok
         ? ((await ownedRes.json()) as { ownedIds?: string[] })
         : null;
       const ownedIds = new Set<string>(ownedPayload?.ownedIds ?? []);
       const userId = session?.user?.id ?? null;

-      const normalized = Array.isArray(data)
-        ? data.map((set) =>
-            annotateImageSetOwnership(set, userId, ownedIds.has(set.id)),
-          )
-        : [];

*      // 1) Normale Index-Daten annotieren
*      const normalized = Array.isArray(data)
*        ? data.map((set) =>
*            annotateImageSetOwnership(set, userId, ownedIds.has(set.id)),
*          )
*        : [];
*
*      // 2) Hardening: Falls der Index owned Sets (kurzzeitig) NICHT liefert,
*      //    holen wir fehlende owned IDs gezielt nach und mergen sie rein.
*      const presentIds = new Set(normalized.map((s) => s.id));
*      const missingOwnedIds = Array.from(ownedIds).filter(
*        (id) => !presentIds.has(id),
*      );
*
*      let recovered: ImageSet[] = [];
*      if (missingOwnedIds.length > 0) {
*        // Hole Details pro fehlender ID und markiere sie als owned
*        const detailCalls = missingOwnedIds.map(async (id) => {
*          try {
*            const r = await fetch(`/api/imagesets/${id}`, { cache: "no-store" });
*            if (!r.ok) return null;
*            const full = (await r.json()) as ImageSet;
*            return annotateImageSetOwnership(full, userId, true);
*          } catch {
*            return null;
*          }
*        });
*        const results = await Promise.all(detailCalls);
*        recovered = results.filter((x): x is ImageSet => Boolean(x));
*      }

-      setSets(normalized ?? []);

*      setSets([...(normalized ?? []), ...recovered]);
       } catch (error) {
         console.error("Error loading image collections:", error);
         toast.error("Failed to load image collections");
       } finally {
         setLoading(false);
       }
  }
  \*\*\* End Patch
  Damit „klebt“ deine User-Liste an der tatsächlichen Ownership (über /api/user-image-collections) und bleibt stabil – auch wenn der /api/imagesets-Index mal schwankt. (Siehe vorhandene Ownership-Infrastruktur: GET/POST/DELETE Endpoints
  codebase

und Server-Helper
codebase

codebase

. Die bestehende Erstellung markiert ohnehin Ownership: createSet() → POST /api/user-image-collections
codebase

.)

(Optional, aber sinnvoll) Default-Kategorie bei Erstellung absichern
Falls an irgendeiner Stelle ein Client die Kategorie nicht mitsendet, setzen wir sie im Edge-Proxy auf "personal", sobald ein User authentifiziert ist. Das ist ein No-Brainer-Fallback und bricht nichts, wenn die Kategorie schon gesetzt ist.

diff
Code kopieren
**_ Begin Patch
_** Update File: src/app/api/imagesets/route.ts
@@
export async function POST(request: NextRequest) {
try {

- const body = await request.json();

* const body = await request.json();
  const session = await auth();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.user?.id) {
  // WICHTIG: Owner-Verknüpfung für persönliche Kollektionen
  headers["x-user-id"] = session.user.id;
  }

- const response = await fetch(`${API_BASE_URL}/imagesets`, {

* // Fallback: Wenn kein category-Feld gesetzt ist, aber ein User existiert,
* // defaulten wir auf "personal", damit die Collection sauber einsortiert wird.
* const payload =
*      body && typeof body === "object"
*        ? { category: "personal", ...body }
*        : { category: "personal" };
*
* const response = await fetch(`${API_BASE_URL}/imagesets`, {
  method: "POST",
  headers,

-      body: JSON.stringify(body),

*      body: JSON.stringify(payload),
       });
       const data = await response.json();
       return NextResponse.json(data);
  } catch (error) {
  return NextResponse.json(
  { error: "Failed to create image set" },
  { status: 500 },
  );
  }
  }
  \*\*\* End Patch
