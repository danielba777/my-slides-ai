"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { Edit, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LandingPageTheme {
  id: string;
  category: string;
  heroTitle: string;
  heroSubtitle?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function LandingPageThemesPage() {
  const [themes, setThemes] = useState<LandingPageTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/landing-page-themes", {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setThemes(data);
      } else {
        toast.error("Fehler beim Laden der Themes");
      }
    } catch (error) {
      console.error("Error loading themes:", error);
      toast.error("Fehler beim Laden der Themes");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTheme = async (id: string) => {
    if (!confirm("Möchtest du dieses Theme wirklich löschen?")) {
      return;
    }

    try {
      const response = await fetch(`/api/landing-page-themes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Theme gelöscht");
        loadThemes();
      } else {
        toast.error("Fehler beim Löschen des Themes");
      }
    } catch (error) {
      console.error("Error deleting theme:", error);
      toast.error("Fehler beim Löschen des Themes");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Lade Themes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Landing Page Themes</h1>
          <p className="text-muted-foreground">
            Verwalte kategoriebasierte Landing Page Themes
          </p>
        </div>
        <Link
          href="/admin/landing-page/themes/new"
          className={cn(
            buttonVariants({ variant: "default" }),
            "flex items-center gap-2",
          )}
        >
          <Plus className="h-4 w-4" />
          Neues Theme
        </Link>
      </div>

      {themes.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Noch keine Themes vorhanden</p>
              <p className="text-sm">Erstelle dein erstes Landing Page Theme</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Übersicht
              <Badge variant="secondary" className="text-xs">
                {themes.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">Kategorie</TableHead>
                    <TableHead className="w-[35%]">Hero Title</TableHead>
                    <TableHead className="w-[30%]">Hero Subtitle</TableHead>
                    <TableHead className="w-[8%]">Status</TableHead>
                    <TableHead className="w-[7%] text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {themes.map((theme) => (
                    <TableRow key={theme.id} className="text-sm">
                      <TableCell className="align-middle">
                        <Badge variant="outline" className="font-mono">
                          {theme.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="font-medium line-clamp-2">
                          {theme.heroTitle}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        {theme.heroSubtitle ? (
                          <span className="text-muted-foreground line-clamp-2">
                            {theme.heroSubtitle}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Kein Subtitle
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="align-middle">
                        <Badge
                          variant={theme.isActive ? "secondary" : "outline"}
                          className="shrink-0 text-xs"
                        >
                          {theme.isActive ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/landing-page/themes/${theme.id}`}
                            aria-label="Theme bearbeiten"
                            className={cn(
                              buttonVariants({ variant: "outline", size: "icon" }),
                            )}
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTheme(theme.id)}
                            className="text-destructive hover:text-destructive"
                            aria-label="Theme löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
