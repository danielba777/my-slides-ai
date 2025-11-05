"use client";
// Wir re-use'n die bestehende UGC-Oberfläche aus dem Dashboard,
// damit keine doppelte Logik entsteht und alles sofort funktioniert.
// (Client-Komponente ist ok, Admin-Layout liefert nur den Rahmen.)
import UgcDashboardPage from "@/app/dashboard/ugc/page";
export default function HookGeneratorAdminPage() {
  return <UgcDashboardPage />;
}