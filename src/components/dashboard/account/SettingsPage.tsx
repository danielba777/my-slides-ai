"use client";

import ProfileBilling from "@/components/dashboard/billing/ProfileBilling";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, Puzzle, UserRound } from "lucide-react";
import SettingsConnections from "./SettingsConnections";
import SettingsChromeExtension from "./SettingsChromeExtension";
export default function SettingsPage() {
  return (
    <div className="w-full px-10 py-12 space-y-8">
      {/* Page Header (match dashboard pages) */}
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your account, subscription and integrations.
        </p>
      </header>

      {/* Main */}
      <Tabs
        defaultValue="personal"
        orientation="vertical"
        className="w-full"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
          {/* Left: vertical nav (modern SaaS look) */}
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
          </TabsList>

          {/* Right: content area */}
          <div className="space-y-6">
            {/* PERSONAL */}
            <TabsContent value="personal" className="m-0">
              <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <ProfileBilling />
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONNECTIONS */}
            <TabsContent value="connections" className="m-0">
              <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <SettingsConnections />
                </CardContent>
              </Card>
            </TabsContent>

            {/* CHROME EXTENSION */}
            <TabsContent value="chrome-extension" className="m-0">
              <SettingsChromeExtension />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
