Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

*** Begin Patch
*** Update File: src/app/dashboard/ugc/page.tsx
@@
-  const [avatarTab, setAvatarTab] = useState("default");
+  const [avatarTab, setAvatarTab] = useState("default");
@@
-  const loadAvatars = async () => {
+  const loadAvatars = async () => {
     try {
       setAvatarsLoading(true);
       const response = await fetch("/api/ugc/reaction-avatars");
       const data = await response.json();
       if (!response.ok) {
         throw new Error(data?.error || "Unable to load reaction avatars");
       }
-      const avatarsData: ReactionAvatar[] = Array.isArray(data?.avatars)
-        ? data.avatars
-        : [];
-      setAvatars(avatarsData);
+      const raw: ReactionAvatar[] = Array.isArray(data?.avatars) ? data.avatars : [];
+      // Nur Avatare zeigen, die ein gültiges Hook-Video hinterlegt haben
+      const avatarsData = raw.filter((a) => {
+        const v = (a.videoUrl ?? "").trim().toLowerCase();
+        return v && v !== "about:blank";
+      });
+      setAvatars(avatarsData);
       if (!selectedAvatarId) {
         const firstAvatarId = avatarsData[0]?.id;
         if (firstAvatarId) {
           setSelectedAvatarId(firstAvatarId);
         }
       }
@@
-              {/* Avatars (ohne innere Box, kompakt) */}
+              {/* Avatars (ohne innere Box, kompakt) */}
               <section className="p-0">
                 <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                   <div>
-                    <h2 className="text-base font-semibold">2. AI Avatar</h2>
+                    <h2 className="text-base font-semibold">2. AI Avatar</h2>
                   </div>
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     className="gap-2 rounded-full px-3"
                     onClick={() => {
                       void loadAvatars();
                     }}
                     disabled={avatarsLoading}
                   >
                     <RefreshCw className="h-4 w-4" />
                     Aktualisieren
                   </Button>
                 </div>
 
                 <Tabs
                   value={avatarTab}
                   onValueChange={setAvatarTab}
                   className="mt-4"
                 >
-                  <TabsList className="grid h-10 w-full grid-cols-3 rounded-full bg-muted p-1">
-                    <TabsTrigger
-                      value="default"
-                      className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
-                    >
-                      Default
-                    </TabsTrigger>
-                    <TabsTrigger
-                      value="ugc"
-                      className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
-                    >
-                      My UGC
-                    </TabsTrigger>
-                    <TabsTrigger
-                      value="uploads"
-                      className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
-                    >
-                      Uploads
-                    </TabsTrigger>
-                  </TabsList>
+                  {/* Nur eine sichtbare Tab-Option: Community */}
+                  <TabsList className="grid h-10 w-full grid-cols-1 rounded-full bg-muted p-1">
+                    <TabsTrigger
+                      value="default"
+                      className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
+                    >
+                      Community
+                    </TabsTrigger>
+                  </TabsList>
 
                   <TabsContent value="default" className="mt-4">
                     {avatarsLoading ? (
                       <div className="flex h-48 items-center justify-center">
                         <Spinner className="h-6 w-6" />
                       </div>
                     ) : avatars.length === 0 ? (
                       <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/40 text-center text-sm text-muted-foreground">
-                        No reaction avatars yet. Add them via the admin panel.
+                        Keine passenden Avatare mit Video vorhanden.
                       </div>
                     ) : (
-                      <ScrollArea className="h-44 rounded-2xl border border-border/50 bg-muted/40">
-                        <div className="grid grid-cols-4 gap-2 p-2 sm:grid-cols-6 md:grid-cols-8">
+                      <ScrollArea className="h-40 rounded-2xl border border-border/50 bg-muted/40">
+                        <div className="grid grid-cols-5 gap-2 p-2 sm:grid-cols-7 md:grid-cols-9">
                           {avatars.slice(0, 48).map((avatar) => (
                             <button
                               key={avatar.id}
                               className={cn(
-                                "relative aspect-square overflow-hidden rounded-lg border border-transparent transition-all duration-150 hover:ring-2 hover:ring-foreground/40",
+                                "relative aspect-square overflow-hidden rounded-lg border border-transparent transition-all duration-150 hover:ring-2 hover:ring-foreground/40",
                                 selectedAvatarId === avatar.id
                                   ? "ring-2 ring-foreground"
                                   : "",
                               )}
                               onClick={() => setSelectedAvatarId(avatar.id)}
-                              title={avatar.name}
                             >
                               <img
                                 src={avatar.thumbnailUrl}
                                 className="h-full w-full object-cover"
                                 alt={avatar.name}
                               />
                               {/* Kein Hover-Text, nur dezente Markierung */}
                             </button>
                           ))}
                         </div>
                       </ScrollArea>
                     )}
                   </TabsContent>
-
-                  <TabsContent value="ugc" className="mt-4">
-                    <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/30 text-sm text-muted-foreground">
-                      Verbinde deine persönlichen Avatare – Upload bald
-                      verfügbar.
-                    </div>
-                  </TabsContent>
-
-                  <TabsContent value="uploads" className="mt-4">
-                    <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/30 text-sm text-muted-foreground">
-                      Lade eigene Clips hoch, um sie als Avatar zu nutzen.
-                      Coming soon.
-                    </div>
-                  </TabsContent>
                 </Tabs>
               </section>
@@
-                        <Link
-                          href="/dashboard/account/settings"
+                        <Link
+                          href="/dashboard/account/settings#demos"
                           className="relative aspect-[9/16] h-[120px] rounded-xl border border-dashed border-border/70 bg-background/60 hover:border-foreground/50 hover:bg-background/80 flex items-center justify-center"
                           title="Demo hochladen"
                         >
                           <Plus className="h-6 w-6" />
                         </Link>
@@
-      <section className="space-y-4">
+      <section className="space-y-4">
         <div className="flex flex-wrap items-end justify-between gap-3">
           <div>
             <h2 className="text-xl font-semibold">
               My Videos ({videos.length})
             </h2>
             <p className="text-sm text-muted-foreground">
               Alle generierten Videos auf einen Blick – öffne sie für Preview,
               Download oder Scheduling.
             </p>
           </div>
           <div className="flex flex-wrap items-center gap-2">
@@
-        {videosLoading ? (
+        {videosLoading ? (
           <div className="flex h-28 items-center justify-center">
             <Spinner className="h-6 w-6" />
           </div>
-        ) : videos.length === 0 ? (
-          <div className="rounded-2xl border px-4 py-10 text-center text-sm text-muted-foreground">
-            Noch keine Videos vorhanden. Generiere dein erstes Video.
-          </div>
+        ) : videos.length === 0 ? (
+          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4">
+            {/* Imaginäre Kacheln wie bei Avatars */}
+            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
+              {Array.from({ length: 8 }).map((_, i) => (
+                <div
+                  key={i}
+                  className="aspect-[9/16] w-full rounded-xl border border-dashed border-border/60 bg-background/40"
+                />
+              ))}
+            </div>
+            <p className="mt-4 text-center text-sm text-muted-foreground">
+              Noch keine Videos vorhanden. Generiere dein erstes Video.
+            </p>
+          </div>
         ) : (
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {videos.map((video) => (
               <Card key={video.id} className="overflow-hidden rounded-2xl">
                 <CardContent className="space-y-3 p-4">
*** End Patch
diff
Code kopieren
*** Begin Patch
*** Update File: src/components/dashboard/account/SettingsPage.tsx
@@
-"use client";
-
-import { useEffect, useState } from "react";
-import { useSearchParams } from "next/navigation";
+"use client";
+
+import { useEffect, useState } from "react";
+import { useSearchParams } from "next/navigation";
@@
-export default function SettingsPage() {
-  const searchParams = useSearchParams();
-  const initialTab = searchParams?.get("tab") ?? "personal";
-  const [tab, setTab] = useState(initialTab);
-
-  useEffect(() => {
-    const param = searchParams?.get("tab");
-    if (param && param !== tab) {
-      setTab(param);
-    }
-  }, [searchParams, tab]);
+export default function SettingsPage() {
+  const searchParams = useSearchParams();
+  const initialTab = (searchParams?.get("tab") ?? "").trim() || "personal";
+  const [tab, setTab] = useState(initialTab);
+
+  // Hash (#connections / #demos) → Tab synchronisieren
+  useEffect(() => {
+    const applyHash = () => {
+      const hash = (window.location.hash || "").replace("#", "");
+      if (hash === "connections" || hash === "demos" || hash === "personal") {
+        setTab(hash);
+      }
+    };
+    applyHash();
+    window.addEventListener("hashchange", applyHash);
+    return () => window.removeEventListener("hashchange", applyHash);
+  }, []);
+
+  // ?tab=… weiter unterstützen
+  useEffect(() => {
+    const param = searchParams?.get("tab");
+    if (param && param !== tab) {
+      setTab(param);
+      // URL-Hash angleichen (für Deep-Link-Konsistenz)
+      if (typeof window !== "undefined") {
+        window.location.hash = `#${param}`;
+      }
+    }
+  }, [searchParams, tab]);
@@
-       <Tabs
-         value={tab}
-         onValueChange={setTab}
+       <Tabs
+         value={tab}
+         onValueChange={(v) => {
+           setTab(v);
+           // Beim Tab-Wechsel Hash setzen, damit #links funktionieren
+           if (typeof window !== "undefined") {
+             window.location.hash = `#${v}`;
+           }
+         }}
          orientation="vertical"
          className="w-full"
        >
@@
-            {/* PERSONAL */}
-            <TabsContent value="personal" className="m-0">
+            {/* PERSONAL */}
+            <TabsContent value="personal" className="m-0" id="personal">
               <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                 <CardContent className="p-6 md:p-8">
                   <ProfileBilling />
                 </CardContent>
               </Card>
             </TabsContent>
 
-            {/* CONNECTIONS */}
-            <TabsContent value="connections" className="m-0">
+            {/* CONNECTIONS */}
+            <TabsContent value="connections" className="m-0" id="connections">
               <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                 <CardContent className="p-6 md:p-8">
                   <SettingsConnections />
                 </CardContent>
               </Card>
             </TabsContent>
 
-            {/* DEMOS */}
-            <TabsContent value="demos" className="m-0">
+            {/* DEMOS */}
+            <TabsContent value="demos" className="m-0" id="demos">
               <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                 <CardContent className="p-6 md:p-8">
                   <SettingsDemoVideos />
                 </CardContent>
               </Card>
             </TabsContent>
*** End Patch