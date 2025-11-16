"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NewThemePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    heroTitle: "",
    heroSubtitle: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.heroTitle) {
      toast.error("Kategorie und Hero Title sind Pflichtfelder");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/landing-page-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Theme erfolgreich erstellt");
        router.push("/admin/landing-page/themes");
      } else {
        const error = await response.json();
        toast.error(error.message || "Fehler beim Erstellen des Themes");
      }
    } catch (error) {
      console.error("Error creating theme:", error);
      toast.error("Fehler beim Erstellen des Themes");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/landing-page/themes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Neues Theme erstellen</h1>
          <p className="text-muted-foreground">
            Erstelle ein neues Landing Page Theme für eine Kategorie
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Theme Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {}
            <div className="space-y-2">
              <Label htmlFor="category">
                Kategorie <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="z.B. nutrition, fitness, wellness"
                required
              />
              <p className="text-xs text-muted-foreground">
                Die Kategorie muss eindeutig sein und mit der URL übereinstimmen (z.B. /nutrition)
              </p>
            </div>

            {}
            <div className="space-y-2">
              <Label htmlFor="heroTitle">
                Hero Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="heroTitle"
                value={formData.heroTitle}
                onChange={(e) =>
                  setFormData({ ...formData, heroTitle: e.target.value })
                }
                placeholder="z.B. Automate Nutrition slides that actually drive traffic"
                required
              />
              <p className="text-xs text-muted-foreground">
                Die Hauptüberschrift im Hero-Bereich
              </p>
            </div>

            {}
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
              <Textarea
                id="heroSubtitle"
                value={formData.heroSubtitle}
                onChange={(e) =>
                  setFormData({ ...formData, heroSubtitle: e.target.value })
                }
                placeholder="z.B. Create viral nutrition TikTok slides in seconds..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Der Untertitel unter der Hauptüberschrift
              </p>
            </div>

            {}
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (intern)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Notizen für interne Verwendung..."
                rows={3}
              />
            </div>

            {}
            <div className="space-y-2">
              <Label htmlFor="metaTitle">SEO Meta Title</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) =>
                  setFormData({ ...formData, metaTitle: e.target.value })
                }
                placeholder="z.B. SlidesCockpit - Nutrition TikTok Slides"
              />
              <p className="text-xs text-muted-foreground">
                Wird im Browser-Tab und in Suchergebnissen angezeigt
              </p>
            </div>

            {}
            <div className="space-y-2">
              <Label htmlFor="metaDescription">SEO Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) =>
                  setFormData({ ...formData, metaDescription: e.target.value })
                }
                placeholder="Kurze Beschreibung für Suchmaschinen..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Wird in Suchergebnissen unter dem Titel angezeigt (max. 160 Zeichen)
              </p>
            </div>

            {}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Theme ist aktiv
              </Label>
            </div>

            {}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Wird erstellt..." : "Theme erstellen"}
              </Button>
              <Link href="/admin/landing-page/themes">
                <Button type="button" variant="outline">
                  Abbrechen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

