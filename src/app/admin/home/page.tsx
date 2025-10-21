import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Verwalte deine SlidesCockpit-Einstellungen
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Bilder-Sets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Verwalte deine Bilder-Sets für Präsentationen
            </p>
            <Link href="/admin/slideshows/imagesets">
              <Button className="w-full">Bilder-Sets verwalten</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Einstellungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              System-Einstellungen und Konfiguration
            </p>
            <Button variant="outline" disabled className="w-full">
              Bald verfügbar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
