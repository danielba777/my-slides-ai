// src/app/admin/slideshows/custom-imagesets/page.tsx
"use client";

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
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ImageSet = {
  id: string;
  name: string;
  slug: string | null;
  isActive: boolean;
  createdAt: string;
  parentId?: string | null;
  children?: ImageSet[];
  _count: { images: number; children?: number };
  category?: string | null;
};

function keepOnlyPersonal(sets: ImageSet[] | undefined): ImageSet[] {
  if (!Array.isArray(sets)) return [];
  const out: ImageSet[] = [];
  for (const s of sets) {
    const cat = (s.category ?? "").toLowerCase();
    const isPersonal = cat === "personal" || cat === "mine" || cat === "user";
    let children: ImageSet[] | undefined;
    if (s.children?.length) children = keepOnlyPersonal(s.children);
    if (isPersonal || (children && children.length > 0)) {
      out.push({ ...s, children });
    }
  }
  return out;
}

function flattenTree(sets: ImageSet[], level = 0): Array<ImageSet & { level: number }> {
  const list: Array<ImageSet & { level: number }> = [];
  for (const s of sets) {
    list.push({ ...s, level });
    if (s.children?.length) list.push(...flattenTree(s.children, level + 1));
  }
  return list;
}

export default function CustomImagesetsAdminPage() {
  const [data, setData] = useState<ImageSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/imagesets");
        if (!res.ok) throw new Error("Failed to fetch image sets");
        const all = (await res.json()) as ImageSet[];
        setData(keepOnlyPersonal(all));
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
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Keine Custom Imagesets</p>
              <p className="text-sm">Sie erscheinen automatisch, wenn Nutzer:innen Collections anlegen.</p>
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
                  {flat.map((set) => (
                    <TableRow key={set.id}>
                      <TableCell>
                        <div className="flex items-center" style={{ paddingLeft: `${set.level * 16}px` }}>
                          <span className="font-medium">{set.name}</span>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}