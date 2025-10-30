"use client";

import { useEffect, useMemo, useState } from "react";
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
import { hasPersonalCategoryTag } from "@/lib/image-set-ownership";

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

function flattenTree(sets: ImageSet[] = [], level = 0): Array<ImageSet & { level: number }> {
  const out: Array<ImageSet & { level: number }> = [];
  for (const s of sets) {
    out.push({ ...s, level });
    if (s.children?.length) {
      out.push(...flattenTree(s.children, level + 1));
    }
  }
  return out;
}

export default function CustomImagesetsAdminPage() {
  const [data, setData] = useState<ImageSet[]>([]);
  const [loading, setLoading] = useState(true);

  // Besitzer-E-Mails laden
  const [owners, setOwners] = useState<Record<string, { userId: string; email: string | null }>>({});
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/user-image-collections", { cache: "no-store" });
        if (!res.ok) return;
        const list = (await res.json()) as Array<{ imageSetId: string; userId: string; email: string | null }>;
        const map: Record<string, { userId: string; email: string | null }> = {};
        for (const row of list) map[row.imageSetId] = { userId: row.userId, email: row.email ?? null };
        setOwners(map);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/imagesets", { cache: "no-store" });
        if (!r.ok) throw new Error("Failed to fetch image sets");
        const json = (await r.json()) as ImageSet[];

        // Admin → "Custom Imagesets": nur die persönlichen/user-erstellten Sets anzeigen
        // Wir filtern auf Kategorie personal/mine/user (inkl. verschachtelte Bäume)
        const filterPersonal = (arr: ImageSet[] = []): ImageSet[] =>
          arr
            .filter((s) => isPersonalSet(s))
            .map((s) => ({
              ...s,
              children: s.children ? filterPersonal(s.children) : [],
            }));

        // Falls die API alle Top-Level mischt, schneiden wir gezielt auf persönliche zu:
        const personalOnly = filterPersonal(json);
        setData(personalOnly);
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
                    <TableHead className="w-[50%]">Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead className="text-right">Bilder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flat.map((set) => {
                    const owner = owners[set.id];
                    return (
                    <TableRow key={set.id}>
                      <TableCell>
                        <div className="flex items-center gap-3" style={{ paddingLeft: `${set.level * 16}px` }}>
                          <span className="font-medium">{set.name}</span>
                          {owner?.email && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              {owner.email}
                            </span>
                          )}
                        </div>
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
