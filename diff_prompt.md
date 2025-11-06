Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

--- a/src/app/dashboard/ugc/page.tsx
+++ b/src/app/dashboard/ugc/page.tsx
@@
export default function UgcDashboardPage() {
const [avatars, setAvatars] = useState<ReactionAvatar[]>([]);
const [avatarsLoading, setAvatarsLoading] = useState(true);
const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);

- const [avatarTab, setAvatarTab] = useState("default");

* // nur eine sichtbare Registerkarte: "community"
* const [avatarTab, setAvatarTab] = useState("community");
  @@
  const loadAvatars = async () => {
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

*      // nur Avatare mit gültigem Hook-Video zeigen
*      const raw: ReactionAvatar[] = Array.isArray(data?.avatars) ? data.avatars : [];
*      const avatarsData = raw.filter((a) => {
*        const v = (a.videoUrl ?? "").trim().toLowerCase();
*        return !!v && v !== "about:blank";
*      });
         setAvatars(avatarsData);
         if (!selectedAvatarId) {
           const firstAvatarId = avatarsData[0]?.id;
           if (firstAvatarId) {
             setSelectedAvatarId(firstAvatarId);
           }
         }
       } catch (error) {
         console.error("[UGC] loadAvatars failed", error);
         toast.error("Unable to load reaction avatars");
       } finally {
         setAvatarsLoading(false);
       }
  };
  @@
  return (
  <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6 md:p-10">
  @@

-      <Card className="rounded-3xl border border-border/60 bg-card/95 shadow-xl">

*      <Card className="rounded-3xl border border-border/60 bg-card/95 shadow-xl">
         <CardContent className="p-5 sm:p-7 lg:p-9">
           {/* 60% / 40% Layout */}

-          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">

*          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
               {/* LEFT: Hook + Avatars + Demos */}
               <div className="flex flex-col gap-5">
  @@
  {/_ Avatars (ohne innere Box, kompakt) _/}
  <section className="p-0">
  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
  <div>
  <h2 className="text-base font-semibold">2. AI Avatar</h2>
  </div>
  <Button
  type="button"
  variant="outline"
  size="sm"
  className="gap-2 rounded-full px-3"
  onClick={() => {
  void loadAvatars();
  }}
  disabled={avatarsLoading} >
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
-
-                  <TabsContent value="default" className="mt-4">

*                  <TabsList className="grid h-10 w-full grid-cols-1 rounded-full bg-muted p-1">
*                    <TabsTrigger
*                      value="community"
*                      className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
*                    >
*                      Community
*                    </TabsTrigger>
*                  </TabsList>
*
*                  <TabsContent value="community" className="mt-4">
                     {avatarsLoading ? (

-                      <div className="flex h-48 items-center justify-center">

*                      <div className="flex h-64 items-center justify-center">
                         <Spinner className="h-6 w-6" />
                       </div>
                     ) : avatars.length === 0 ? (
                       <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/40 text-center text-sm text-muted-foreground">
                         No reaction avatars yet. Add them via the admin panel.
                       </div>
                     ) : (

-                      <ScrollArea className="h-44 rounded-2xl border border-border/50 bg-muted/40">
-                        <div className="grid grid-cols-4 gap-2 p-2 sm:grid-cols-6 md:grid-cols-8">

*                      {/* 4 Reihen sichtbar, danach Scroll */}
*                      <ScrollArea className="h-64 sm:h-72 lg:h-80 rounded-2xl border border-border/50 bg-muted/40">
*                        <div className="grid grid-cols-4 gap-2 p-2 sm:grid-cols-6 md:grid-cols-8">
                           {avatars.slice(0, 48).map((avatar) => (
                             <button
                               key={avatar.id}
                               className={cn(
                                 "relative aspect-square overflow-hidden rounded-lg border border-transparent transition-all duration-150 hover:ring-2 hover:ring-foreground/40",
                                 selectedAvatarId === avatar.id
                                   ? "ring-2 ring-foreground"
                                   : "",
                               )}
                               onClick={() => setSelectedAvatarId(avatar.id)}
                               title={avatar.name}
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

               {/* Demos (ohne Box, als 9:16 Cards + Platzhalter rechts) */}
               <section className="p-0">
                 <h2 className="text-base font-semibold">3. Demos</h2>
                 <div className="mt-4">
                   {demosLoading ? (
                     <div className="flex h-28 items-center justify-center">
                       <Spinner className="h-6 w-6" />
                     </div>
                   ) : (

-                    <ScrollArea className="h-[140px] rounded-2xl border border-border/50 bg-muted/40">

*                    {/* 2 Reihen sichtbar, danach Scroll */}
*                    <ScrollArea className="h-[260px] sm:h-[300px] rounded-2xl border border-border/50 bg-muted/40">
                       <div className="flex items-center gap-3 p-3">
                         {demos.map((demo) => {
                           const isActive = selectedDemoId === demo.id;
                           return (
                             <button
                               key={demo.id}
                               type="button"
                               onClick={() => setSelectedDemoId(demo.id)}
                               className={cn(
                                 "relative aspect-[9/16] h-[120px] overflow-hidden rounded-xl border bg-black text-white transition",
                                 isActive
                                   ? "ring-2 ring-foreground"
                                   : "hover:ring-2 hover:ring-foreground/40",
                               )}
                               title={demo.name || "Demo"}
                             >
                               {/* Thumbnail falls vorhanden, sonst dunkle Fläche */}
                               {demo.thumbnailUrl ? (
                                 // eslint-disable-next-line @next/next/no-img-element
                                 <img
                                   src={demo.thumbnailUrl}
                                   alt={demo.name || "Demo"}
                                   className="h-full w-full object-cover"
                                 />
                               ) : (
                                 <div className="flex h-full w-full items-center justify-center text-xs text-white/70">
                                   Demo
                                 </div>
                               )}
                             </button>
                           );
                         })}
                         {/* Platzhalter-Kärtchen mit + ganz rechts */}
                         <Link

-                          href="/dashboard/account/settings"

*                          href="/dashboard/account/settings#demos"
                           className="relative aspect-[9/16] h-[120px] rounded-xl border border-dashed border-border/70 bg-background/60 hover:border-foreground/50 hover:bg-background/80 flex items-center justify-center"
                           title="Demo hochladen"
                         >
                           <Plus className="h-6 w-6" />
                         </Link>
                       </div>
                     </ScrollArea>
                   )}
                 </div>
               </section>
             </div>

             {/* RIGHT: Video Preview + Controls (ohne zusätzliche Box) */}
             <div className="flex flex-col gap-4">

-              <div className="relative mx-auto aspect-[9/16] w-full max-w-[420px] overflow-hidden rounded-2xl bg-black">

*              {/* etwas kompakter (ca. -20%) */}
*              <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl bg-black">
                   {previewVideoSrc || previewFallbackImage ? (
                     <>
                       {previewVideoSrc ? (
                         <video
                           key={previewVideoKey}
                           src={previewVideoSrc}
                           className="h-full w-full object-cover"
                           autoPlay
                           loop
                           muted
                           playsInline
                         />
                       ) : previewFallbackImage ? (
                         <>
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img
                             src={previewFallbackImage}
                             alt={selectedAvatar?.name ?? "Reaction avatar"}
                             className="h-full w-full object-cover"
                           />
                         </>
                       ) : null}
                       {/* Hook Overlay */}
                       {hook.trim().length > 0 && (
                         <div
                           className={cn(
                             "pointer-events-none absolute left-1/2 w-[86%] -translate-x-1/2 text-center text-white",
                             hookPosition === "middle"
                               ? "top-1/2 -translate-y-1/2"
                               : "top-[18%]",
                           )}
                           style={{
                             WebkitTextStroke: "2px rgba(0,0,0,0.85)",
                             textShadow:
                               "0 2px 6px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.5)",
                           }}
                         >
                           <span className="text-2xl font-semibold leading-snug md:text-3xl">
                             {hook}
                           </span>
                         </div>
                       )}
                     </>
                   ) : (
                     <div className="flex h-full items-center justify-center">
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <VideoOff className="h-4 w-4" />
                         Wähle einen Avatar und optional eine Demo.
                       </div>
                     </div>
                   )}
                 </div>
               </div>

               {/* Hook-Position als Icons (unter dem Video) */}
               <div className="flex items-center justify-center gap-2">
                 <Button

  @@
  </Card>

-      <section className="space-y-4">

*      {/* MY VIDEOS – wie AI Avatars (Kacheln + Aktionen) */}
*      <section className="space-y-4">
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
             <Button
               type="button"
               variant="outline"
               size="sm"
               className="gap-2 rounded-full px-4"
               onClick={() => {
                 void loadVideos();
               }}
               disabled={videosLoading}
             >
               <RefreshCw className="h-4 w-4" />
               Refresh
             </Button>
             <Button
               type="button"
               variant="outline"
               size="sm"
               className="gap-2 rounded-full px-4"
               onClick={() => {
                 void refreshAccounts();
               }}
               disabled={accountsLoading}
             >
               <Settings className="h-4 w-4" />
               Accounts
             </Button>
           </div>
         </div>

         {videosLoading ? (
           <div className="flex h-28 items-center justify-center">
             <Spinner className="h-6 w-6" />
           </div>

-        ) : videos.length === 0 ? (
-          <div className="rounded-2xl border px-4 py-10 text-center text-sm text-muted-foreground">
-            Noch keine Videos vorhanden. Generiere dein erstes Video.
-          </div>
-        ) : (
-          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
-            {videos.map((video) => (
-              <Card key={video.id} className="overflow-hidden rounded-2xl">
-                <CardContent className="space-y-3 p-4">
-                  <video
-                    src={video.compositeVideoUrl}
-                    controls
-                    className="h-56 w-full rounded-xl bg-black object-cover"
-                  />
-                  <div className="flex flex-wrap items-center justify-between gap-2">
-                    <div className="min-w-0">
-                      <p className="truncate text-sm font-medium">
-                        {video.title ?? "UGC Video"}
-                      </p>
-                      {video.scheduleRunAt && (
-                        <p className="truncate text-xs text-muted-foreground">
-                          Scheduled: {new Date(video.scheduleRunAt).toLocaleString()}
-                        </p>
-                      )}
-                    </div>
-                    <div className="flex items-center gap-2">
-                      <Button variant="outline" size="sm" onClick={() => handleDownload(video)}>
-                        Download
-                      </Button>
-                      <Button size="sm" onClick={() => handleOpenVideo(video)}>
-                        Schedule
-                      </Button>
-                    </div>
-                  </div>
-                </CardContent>
-              </Card>
-            ))}
-          </div>
-        )}

*        ) : videos.length === 0 ? (
*          // Platzhalter-Kacheln wie bei Avataren/Templates
*          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4">
*            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
*              {Array.from({ length: 6 }).map((_, i) => (
*                <div
*                  key={i}
*                  className="aspect-[9/16] w-full rounded-xl border border-dashed border-border/60 bg-background/50"
*                />
*              ))}
*            </div>
*            <p className="mt-4 text-center text-sm text-muted-foreground">
*              Noch keine Videos – Generiere dein erstes UGC-Video oben links.
*            </p>
*          </div>
*        ) : (
*          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
*            {videos.map((video) => (
*              <Card key={video.id} className="overflow-hidden rounded-2xl">
*                <CardContent className="space-y-3 p-3">
*                  <div className="relative">
*                    {/* bevorzugt Thumbnail anzeigen (leichter/performanter) */}
*                    {video.compositeThumbnailUrl ? (
*                      // eslint-disable-next-line @next/next/no-img-element
*                      <img
*                        src={video.compositeThumbnailUrl}
*                        alt={video.title ?? "UGC Video"}
*                        className="aspect-[9/16] w-full rounded-xl object-cover"
*                      />
*                    ) : (
*                      <video
*                        src={video.compositeVideoUrl}
*                        muted
*                        className="aspect-[9/16] w-full rounded-xl bg-black object-cover"
*                      />
*                    )}
*                  </div>
*                  <div className="flex items-center justify-between gap-2">
*                    <div className="min-w-0">
*                      <p className="truncate text-sm font-medium">
*                        {video.title ?? "UGC Video"}
*                      </p>
*                      {video.scheduleRunAt && (
*                        <p className="truncate text-xs text-muted-foreground">
*                          Scheduled: {new Date(video.scheduleRunAt).toLocaleString()}
*                        </p>
*                      )}
*                    </div>
*                  </div>
*                  <div className="flex flex-wrap items-center justify-between gap-2">
*                    <div className="flex items-center gap-2">
*                      <Button
*                        variant="outline"
*                        size="sm"
*                        onClick={() => handleDownload(video)}
*                      >
*                        Download
*                      </Button>
*                      <Link
*                        href={video.compositeVideoUrl}
*                        target="_blank"
*                        rel="noopener noreferrer"
*                        className="inline-flex"
*                      >
*                        <Button variant="outline" size="sm">
*                          Open
*                        </Button>
*                      </Link>
*                    </div>
*                    <Button size="sm" onClick={() => handleOpenVideo(video)}>
*                      Post on TikTok
*                    </Button>
*                  </div>
*                </CardContent>
*              </Card>
*            ))}
*          </div>
*        )}
         </section>
  @@
  ) : null}
  </DialogContent>
  </Dialog>
  </div>
  );
  }
