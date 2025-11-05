Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/app/api/ugc/reaction-avatars/import-from-templates/route.ts
@@
-import { NextResponse } from "next/server";
+import { NextResponse } from "next/server";
+import { headers } from "next/headers";
@@

- // Relativer Call vermeidet BASE_URL-Mismatches (lokal & prod)
- const res = await fetch(`/api/ai-avatars/templates`, { cache: "no-store" });

* // Absolute URL aus Request-Headern konstruieren (funktioniert lokal & prod)
* const hdrs = headers();
* const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
* const proto = hdrs.get("x-forwarded-proto") ?? "http";
* if (!host) {
*      return NextResponse.json({ error: "Host header missing" }, { status: 500 });
* }
* const base = `${proto}://${host}`;
* const res = await fetch(`${base}/api/ai-avatars/templates`, { cache: "no-store" });
  \*\*\* End Patch
