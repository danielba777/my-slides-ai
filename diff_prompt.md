Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

*** Begin Patch
*** Update File: src/app/admin/slideshows/imagesets/page.tsx
@@
 // src/app/admin/slideshows/imagesets/page.tsx
 "use client";
 
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Spinner } from "@/components/ui/spinner";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Edit, Folder, Plus, Trash2 } from "lucide-react";
 import { useRouter } from "next/navigation";
-import { useEffect, useState } from "react";
+import { useEffect, useMemo, useState } from "react";
 import { toast } from "sonner";
 import { hasPersonalCategoryTag } from "@/lib/image-set-ownership";
-import { useMemo } from "react";
 
 interface ImageSet {
   id: string;
   name: string;
   slug: string;
   isActive: boolean;
   createdAt: string;
   parentId?: string | null;
   children?: ImageSet[];
   _count: { images: number; children?: number };
   category?: string | null;
 }
 
-const isAiAvatars = (s: ImageSet) => {
-    const t = `${s.slug ?? ""} ${s.name ?? ""} ${s.category ?? ""}`.toLowerCase();
-    return t.includes("avatar");
-  };
-  function removePrivateCollections(list: ImageSet[]) {
-    // Fallback: Wenn Laden fehlschlug, ist allOwned leeres Set -> nichts wird "zu viel" gefiltert
-    return list.filter((s) => isAiAvatars(s) || !allOwned.has(s.id));
-  }
+const isAiAvatars = (s: ImageSet) => {
+  const t = `${s.slug ?? ""} ${s.name ?? ""} ${s.category ?? ""}`.toLowerCase();
+  return t.includes("avatar");
+};
 
 export default function ImageSetsAdminPage() {
   const router = useRouter();
   const [imageSets, setImageSets] = useState<ImageSet[]>([]);
   const [isCreating, setIsCreating] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const [parentForNew, setParentForNew] = useState<string | null>(null);
 
-  // neu: ALLE per UserImageCollection markierten Sets ausblenden (privat)
-  const [allOwned, setAllOwned] = useState<Set<string>>(new Set());
+  // Alle von Usern "owned" (private) Sets global ausblenden
+  const [allOwned, setAllOwned] = useState<Set<string>>(new Set());
+  useEffect(() => {
+    (async () => {
+      try {
+        const r = await fetch("/api/user-image-collections/all", { cache: "no-store" });
+        const j = r.ok ? ((await r.json()) as { allOwnedIds?: string[] }) : { allOwnedIds: [] };
+        setAllOwned(new Set(j.allOwnedIds ?? []));
+      } catch {
+        setAllOwned(new Set());
+      }
+    })();
+  }, []);
 
   // Form state für neues ImageSet
   const [newImageSet, setNewImageSet] = useState({
     name: "",
     parentId: null as string | null,
   });
 
   // Form state für Bearbeitung
   const [editingImageSet, setEditingImageSet] = useState<ImageSet | null>(null);
   const [editForm, setEditForm] = useState({
     name: "",
     isActive: true,
   });
 
+  // Filterfunktion MUSS innerhalb der Komponente auf allOwned zugreifen
+  const removePrivateCollections = useMemo(
+    () =>
+      (list: ImageSet[]) =>
+        // AI Avatars IMMER zeigen, alle owned (private) ausblenden
+        list.filter((s) => isAiAvatars(s) || !allOwned.has(s.id)),
+    [allOwned],
+  );
+
   useEffect(() => {
     (async () => {
       try {
         setIsLoading(true);
-        const res = await fetch("/api/imagesets", { cache: "no-store" });
+        const res = await fetch("/api/imagesets", { cache: "no-store" });
         if (!res.ok) throw new Error("Failed to load image sets");
         const json = (await res.json()) as ImageSet[];
-        const visible = removePrivateCollections(json);
-        setImageSets(visible);
+        setImageSets(removePrivateCollections(json));
       } catch (e) {
         console.error(e);
         toast.error("Fehler beim Laden der Imagesets");
       } finally {
         setIsLoading(false);
       }
     })();
-  }, [allOwned]); // neu: neu filtern, sobald allOwned geladen ist
+  }, [removePrivateCollections]);
 
   const loadImageSets = async () => {
     try {
       setIsLoading(true);
       const res = await fetch("/api/imagesets", { cache: "no-store" });
       if (!res.ok) throw new Error("Failed to load image sets");
       const json = (await res.json()) as ImageSet[];
-      const visible = removePrivateCollections(json);
-      setImageSets(visible);
+      setImageSets(removePrivateCollections(json));
     } catch (e) {
       console.error(e);
       toast.error("Fehler beim Laden der Imagesets");
     } finally {
       setIsLoading(false);
     }
   };
*** End Patch
typescript
Code kopieren
*** Begin Patch
*** Update File: src/app/admin/slideshows/custom-imagesets/page.tsx
@@
 "use client";
 
-import { useEffect, useMemo, useState } from "react";
+import { useEffect, useMemo, useState } from "react";
 import { Badge } from "@/components/ui/badge";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Spinner } from "@/components/ui/spinner";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Folder } from "lucide-react";
 import { toast } from "sonner";
-import { hasPersonalCategoryTag } from "@/lib/image-set-ownership";
+import { hasPersonalCategoryTag } from "@/lib/image-set-ownership";
 
 type ImageSet = {
   id: string;
   name: string;
   slug: string | null;
   category?: string | null;
   parentId?: string | null;
   children?: ImageSet[];
   _count?: { images?: number; children?: number };
 };
 
 function isPersonalSet(set: ImageSet | null | undefined): set is ImageSet {
   if (!set) {
     return false;
   }
   return (
     hasPersonalCategoryTag(set.category) ||
     hasPersonalCategoryTag(set.slug) ||
     hasPersonalCategoryTag(set.name)
   );
 }
 
-function flattenTree(sets: ImageSet[] = [], level = 0): Array<ImageSet & { level: number }> {
-  const out: Array<ImageSet & { level: number }> = [];
-  for (const s of sets) {
-    out.push({ .s, level });
-    if (s.children?.length) {
-      out.push(.flattenTree(s.children, level + 1));
-    }
-  }
-  return out;
-}
+function flattenTree(
+  sets: ImageSet[] = [],
+  level = 0,
+): Array<ImageSet & { level: number }> {
+  const out: Array<ImageSet & { level: number }> = [];
+  for (const s of sets) {
+    out.push({ ...s, level });
+    if (s.children?.length) {
+      out.push(...flattenTree(s.children, level + 1));
+    }
+  }
+  return out;
+}
 
 export default function CustomImagesetsAdminPage() {
   const [data, setData] = useState<ImageSet[]>([]);
   const [loading, setLoading] = useState(true);
 
   // Besitzer-E-Mails laden
-  const [owners, setOwners] = useState<Record<string,
+  const [owners, setOwners] = useState<
+    Record<string, { userId: string; email: string | null }>
+  >({});
   useEffect(() => {
     void (async () => {
       try {
         const res = await fetch("/api/admin/user-image-collections", { cache: "no-store" });
         if (!res.ok) return;
         const response = await res.json();
-        const list = response.owners as Array<{ imageSetId: string; userId: string; email: string | null }> || [];
-        const map: Record<string, { userId: string; email: string | null }> = {};
-        for (const row of list) map[row.imageSetId] = { userId: row.userId, email: row.email ?? null };
+        const list =
+          (response.owners as Array<{
+            imageSetId: string;
+            userId: string;
+            email: string | null;
+          }>) || [];
+        const map: Record<string, { userId: string; email: string | null }> = {};
+        for (const row of list)
+          map[row.imageSetId] = { userId: row.userId, email: row.email ?? null };
         setOwners(map);
       } catch {}
     })();
   }, []);
 
   useEffect(() => {
     (async () => {
       try {
         setLoading(true);
-        const r = await fetch("/api/imagesets", { cache: "no-store" });
-        if (!r.ok) throw new Error("Failed to fetch image sets");
-        const json = (await r.json()) as ImageSet[];
-
-        // Admin → "Custom Imagesets": nur die persönlichen/user-erstellten Sets anzeigen
-        // Wir filtern auf Kategorie personal/mine/user (inkl. verschachtelte Bäume)
-        const filterPersonal = (arr: ImageSet[] = []): ImageSet[] =>
-          arr
-            .filter((s) => isPersonalSet(s))
-            .map((s) => ({
-              ...s,
-              children: s.children ? filterPersonal(s.children) : [],
-            }));
-
-        // Falls die API alle Top-Level mischt, schneiden wir gezielt auf persönliche zu:
-        const personalOnly = filterPersonal(json);
-        setData(personalOnly);
+        const [setsRes, ownedRes] = await Promise.all([
+          fetch("/api/imagesets", { cache: "no-store" }),
+          fetch("/api/user-image-collections/all", { cache: "no-store" }),
+        ]);
+        if (!setsRes.ok) throw new Error("Failed to fetch image sets");
+        const json = (await setsRes.json()) as ImageSet[];
+        const ownedIds: string[] = ownedRes.ok
+          ? ((await ownedRes.json()) as { allOwnedIds?: string[] }).allOwnedIds ?? []
+          : [];
+        const owned = new Set(ownedIds);
+
+        // Admin → "Custom Imagesets": alle User-Collections anzeigen:
+        // Kriterium: in Ownership-Tabelle ODER als 'personal' getaggt.
+        const filterCustom = (arr: ImageSet[] = []): ImageSet[] =>
+          arr
+            .filter((s) => owned.has(s.id) || isPersonalSet(s))
+            .map((s) => ({
+              ...s,
+              children: s.children ? filterCustom(s.children) : [],
+            }));
+
+        setData(filterCustom(json));
       } catch (e) {
         console.error(e);
         toast.error("Fehler beim Laden der Custom Imagesets");
       } finally {
         setLoading(false);
       }
     })();
   }, []);
 
   const flat = useMemo(() => flattenTree(data), [data]);
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold tracking-tight">Custom Imagesets</h1>
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             Übersicht <Badge variant="secondary">{flat.length}</Badge>
           </CardTitle>
         </CardHeader>
         <CardContent>
           {loading ? (
             <div className="flex items-center justify-center py-16">
               <Spinner />
             </div>
           ) : flat.length === 0 ? (
             <div className="py-12 text-center text-muted-foreground">
               <Folder className="mx-auto mb-4 h-16 w-16 opacity-50" />
               <p className="mb-2 text-lg font-medium">Keine Custom Imagesets</p>
               <p className="text-sm">
                 Sie erscheinen automatisch, wenn Nutzer:innen Collections anlegen.
               </p>
             </div>
           ) : (
             <div className="rounded-md border">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="w-[38%]">Name</TableHead>
                     <TableHead className="w-[22%]">Erstellt von (Email)</TableHead>
                     <TableHead>Slug</TableHead>
                     <TableHead>Kategorie</TableHead>
                     <TableHead className="text-right">Bilder</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {flat.map((set) => {
-                    const owner = owners[set.id];
+                    const owner = owners[set.id];
                     return (
                       <TableRow key={set.id}>
                         <TableCell>
-                        <div className="flex items-center" style={{ paddingLeft: `${set.
+                          <div
+                            className="flex items-center"
+                            style={{ paddingLeft: `${set.level * 16}px` }}
+                          >
+                            <span className="font-medium">{set.name}</span>
+                          </div>
                         </TableCell>
                         <TableCell className="text-muted-foreground">
                           {owners[set.id]?.email ? (
                             <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                               {owners[set.id]?.email}
                             </span>
                           ) : "–"}
                         </TableCell>
                         <TableCell className="text-muted-foreground">{set.slug || "-"}</TableCell>
                         <TableCell>
                           <Badge variant="secondary" className="text-xs">
                             {(set.category ?? "personal").toString()}
                           </Badge>
                         </TableCell>
                         <TableCell className="text-right">
                           <Badge variant="outline" className="text-xs">
                             {set._count?.images ?? 0} Bilder
                           </Badge>
                         </TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }
*** End Patch
