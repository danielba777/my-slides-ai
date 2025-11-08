"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import ProfileBilling from "@/components/dashboard/billing/ProfileBilling";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clapperboard, Link2, Music, Puzzle, UserRound } from "lucide-react";
import SettingsChromeExtension from "./SettingsChromeExtension";
import SettingsConnections from "./SettingsConnections";
import SettingsDemoVideos from "./SettingsDemoVideos";
import SettingsSounds from "./SettingsSounds";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get("tab") ?? "").trim() || "personal";
  const [tab, setTab] = useState(initialTab);

  // Hash (#connections / #demos / #chrome-extension / #personal) → Tab synchronisieren
  useEffect(() => {
    const applyHash = () => {
      const hash = (window.location.hash || "").replace("#", "");
      if (
        hash === "connections" ||
        hash === "demos" ||
        hash === "chrome-extension" ||
        hash === "personal" ||
        hash === "sounds"
      ) {
        setTab(hash);
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  // ?tab=… weiter unterstützen
  useEffect(() => {
    const param = searchParams?.get("tab");
    if (param && param !== tab) {
      setTab(param);
      if (typeof window !== "undefined") {
        window.location.hash = `#${param}`;
      }
    }
  }, [searchParams, tab]);

  return (
    <div className="w-full px-10 py-12 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your account, subscription and integrations.
        </p>
      </header>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          if (typeof window !== "undefined") {
            window.location.hash = `#${v}`;
          }
        }}
        orientation="vertical"
        className="w-full"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
          <TabsList
            className="
              md:sticky md:top-20 h-fit
              rounded-2xl border bg-background/70 p-2
              shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60
              md:flex md:flex-col gap-1
            "
          >
            <div className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              General
            </div>

            {/* PERSONAL */}
            <TabsTrigger
              value="personal"
              className="
                group relative w-full justify-start rounded-xl px-3 py-2 text-left
                transition-all duration-200
                hover:bg-muted/50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#304674]/40
                data-[state=active]:bg-[#304674]/12 data-[state=active]:ring-1 data-[state=active]:ring-[#304674]/20
                aria-selected:font-medium
                after:content-[''] after:absolute after:left-1.5 after:top-1/2 after:-translate-y-1/2 after:h-5 after:w-1 after:rounded-full after:bg-[#304674] after:opacity-0 group-data-[state=active]:after:opacity-100
              "
            >
              <span className="inline-flex items-center gap-2">
                <UserRound className="h-4 w-4 opacity-70 transition-transform group-hover:scale-105 group-data-[state=active]:opacity-100" />
                <span>Personal</span>
              </span>
            </TabsTrigger>

            {/* CONNECTIONS */}
            <TabsTrigger
              value="connections"
              className="
                group relative mt-1 w-full justify-start rounded-xl px-3 py-2 text-left
                transition-all duration-200
                hover:bg-muted/50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#304674]/40
                data-[state=active]:bg-[#304674]/12 data-[state=active]:ring-1 data-[state=active]:ring-[#304674]/20
                aria-selected:font-medium
                after:content-[''] after:absolute after:left-1.5 after:top-1/2 after:-translate-y-1/2 after:h-5 after:w-1 after:rounded-full after:bg-[#304674] after:opacity-0 group-data-[state=active]:after:opacity-100
              "
            >
              <span className="inline-flex items-center gap-2">
                <Link2 className="h-4 w-4 opacity-70 transition-transform group-hover:scale-105 group-data-[state=active]:opacity-100" />
                <span>Connections</span>
              </span>
            </TabsTrigger>

            {/* DEMO VIDEOS */}
            <TabsTrigger
              value="demos"
              className="
                group relative mt-1 w-full justify-start rounded-xl px-3 py-2 text-left
                transition-all duration-200
                hover:bg-muted/50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#304674]/40
                data-[state=active]:bg-[#304674]/12 data-[state=active]:ring-1 data-[state=active]:ring-[#304674]/20
                aria-selected:font-medium
                after:content-[''] after:absolute after:left-1.5 after:top-1/2 after:-translate-y-1/2 after:h-5 after:w-1 after:rounded-full after:bg-[#304674] after:opacity-0 group-data-[state=active]:after:opacity-100
              "
            >
              <span className="inline-flex items-center gap-2">
                <Clapperboard className="h-4 w-4 opacity-70 transition-transform group-hover:scale-105 group-data-[state=active]:opacity-100" />
                <span>Demo Videos</span>
              </span>
            </TabsTrigger>

            {/* CHROME EXTENSION */}
            <TabsTrigger
              value="chrome-extension"
              className="
                group relative mt-1 w-full justify-start rounded-xl px-3 py-2 text-left
                transition-all duration-200
                hover:bg-muted/50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#304674]/40
                data-[state=active]:bg-[#304674]/12 data-[state=active]:ring-1 data-[state=active]:ring-[#304674]/20
                aria-selected:font-medium
                after:content-[''] after:absolute after:left-1.5 after:top-1/2 after:-translate-y-1/2 after:h-5 after:w-1 after:rounded-full after:bg-[#304674] after:opacity-0 group-data-[state=active]:after:opacity-100
              "
            >
              <span className="inline-flex items-center gap-2">
                <Puzzle className="h-4 w-4 opacity-70 transition-transform group-hover:scale-105 group-data-[state=active]:opacity-100" />
                <span>Chrome Extension</span>
              </span>
            </TabsTrigger>

            {/* SOUNDS */}
            <TabsTrigger
              value="sounds"
              className="
                group relative mt-1 w-full justify-start rounded-xl px-3 py-2 text-left
                transition-all duration-200
                hover:bg-muted/50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#304674]/40
                data-[state=active]:bg-[#304674]/12 data-[state=active]:ring-1 data-[state=active]:ring-[#304674]/20
                aria-selected:font-medium
                after:content-[''] after:absolute after:left-1.5 after:top-1/2 after:-translate-y-1/2 after:h-5 after:w-1 after:rounded-full after:bg-[#304674] after:opacity-0 group-data-[state=active]:after:opacity-100
              "
            >
              <span className="inline-flex items-center gap-2">
                <Music className="h-4 w-4 opacity-70 transition-transform group-hover:scale-105 group-data-[state=active]:opacity-100" />
                <span>Sounds</span>
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Right: content area */}
          <div className="space-y-6">
            {/* PERSONAL */}
            <TabsContent value="personal" className="m-0" id="personal">
              <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <ProfileBilling />
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONNECTIONS */}
            <TabsContent value="connections" className="m-0" id="connections">
              <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <SettingsConnections />
                </CardContent>
              </Card>
            </TabsContent>

            {/* DEMO VIDEOS */}
            <TabsContent value="demos" className="m-0" id="demos">
              <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CardContent className="p-0 md:p-0">
                  <SettingsDemoVideos />
                </CardContent>
              </Card>
            </TabsContent>

            {/* CHROME EXTENSION */}
            <TabsContent
              value="chrome-extension"
              className="m-0"
              id="chrome-extension"
            >
              <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <SettingsChromeExtension />
                </CardContent>
              </Card>
            </TabsContent>

            {/* SOUNDS */}
            <TabsContent
              value="sounds"
              className="m-0"
              id="sounds"
            >
              <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <SettingsSounds />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
