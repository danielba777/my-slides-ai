Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/components/dashboard/account/SettingsPage.tsx
@@
export default function SettingsPage() {
return (

- <div className="px-4 md:px-6 py-8 md:py-10">
-      {/* Page Header */}
-      <div className="mx-auto w-full max-w-6xl">
-        <div className="mb-8 flex flex-col gap-2">
-          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
-            Settings
-          </h1>
-          <p className="text-sm text-muted-foreground">
-            Configure your account, subscription and integrations.
-          </p>
-        </div>
-      </div>

* <div className="w-full px-10 py-12 space-y-8">
*      {/* Page Header (match dashboard pages) */}
*      <header className="space-y-1">
*        <h1 className="text-3xl font-semibold">Settings</h1>
*        <p className="text-sm text-muted-foreground">
*          Configure your account, subscription and integrations.
*        </p>
*      </header>

       {/* Main */}
       <Tabs
         defaultValue="personal"
         orientation="vertical"

-        className="mx-auto w-full max-w-6xl"

*        className="w-full"
       >
         <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
           {/* Left: vertical nav (modern SaaS look) */}
           <TabsList
             className="
               md:sticky md:top-20 h-fit
               rounded-2xl border bg-background/70 p-2
               shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60
               md:flex md:flex-col
             "
           >
             <div className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
               General
             </div>
             <TabsTrigger
               value="personal"
               className="
                 group relative w-full justify-start rounded-xl px-3 py-2 text-left
                 transition-colors
                 hover:bg-muted/40

-                data-[state=active]:bg-[#304674]/10 data-[state=active]:ring-1 data-[state=active]:ring-[#304674]/20

*                data-[state=active]:bg-[#304674]/10 data-[state=active]:ring-1 data-[state=active]:ring-[#304674]/20
               "
             >
               <span className="inline-flex items-center gap-2">
                 <UserRound className="h-4 w-4 opacity-70 group-data-[state=active]:opacity-100" />
                 <span>Personal</span>
               </span>
               <span className="absolute right-2 top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#304674] group-data-[state=active]:block" />
             </TabsTrigger>

             <TabsTrigger
               value="connections"
               className="
                 group relative mt-1 w-full justify-start rounded-xl px-3 py-2 text-left
                 transition-colors
                 hover:bg-muted/40
                 data-[state=active]:bg-[#304674]/10 data-[state=active]:ring-1 data-[state=active]:ring-[#304674]/20
               "
             >
               <span className="inline-flex items-center gap-2">
                 <Link2 className="h-4 w-4 opacity-70 group-data-[state=active]:opacity-100" />
                 <span>Connections</span>
               </span>
               <span className="absolute right-2 top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#304674] group-data-[state=active]:block" />
             </TabsTrigger>
           </TabsList>

           {/* Right: content area */}
           <div className="space-y-6">
             {/* PERSONAL */}
             <TabsContent value="personal" className="m-0">
               <Card className="overflow-hidden rounded-2xl border bg-card">
                 <CardContent className="p-6 md:p-8">
                   <ProfileBilling />
                 </CardContent>
               </Card>
             </TabsContent>

             {/* CONNECTIONS */}
             <TabsContent value="connections" className="m-0">

-              <Card className="overflow-hidden rounded-2xl bg-card border-0">

*              <Card className="overflow-hidden rounded-2xl border bg-card">
                   <CardContent className="p-6 md:p-8">
                     <SettingsConnections />
                   </CardContent>
                 </Card>
               </TabsContent>
             </div>
           </div>
         </Tabs>
       </div>
  );
  }
  \*\*\* End Patch
