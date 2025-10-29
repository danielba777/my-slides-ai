"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionCard } from "@/components/connections/connection-card";
export default function SettingsConnections() {
  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bestehende Connection-UI sauber eingebettet */}
          <ConnectionCard />
        </CardContent>
      </Card>
    </div>
  );
}