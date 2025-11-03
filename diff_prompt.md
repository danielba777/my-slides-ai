Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/app/dashboard/image-collections/page.tsx
@@
-"use client";
+"use client";

-import type { MouseEvent } from "react";
+import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
-import { Plus } from "lucide-react";
+import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
@@
return (

<div className="w-full px-10 py-12 space-y-6">
<div className="flex items-center justify-between">
<h1 className="text-2xl font-semibold">My Image Collections</h1>

-        <Button
-          onClick={() => setCreating(true)}
-          className="gap-2 rounded-full px-4"
-        >
-          <Plus className="h-4 w-4" />
-          Add
-        </Button>

*        <Button
*          onClick={() => setCreating(true)}
*          variant="ghost"
*          className="h-9 gap-2 rounded-xl border px-3 shadow-sm hover:bg-muted/60"
*        >
*          <Plus className="h-4 w-4" />
*          New collection
*        </Button>
         </div>
  @@

-          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

*          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
             {mySets.map((set) => {
                const previewImages = getPreviewImages(set);

                return (
                  <div
                    key={set.id}
                    onClick={() => handleOpen(set)}

-                   className="group relative cursor-pointer overflow-visible rounded-lg border border-transparent bg-card p-2 transition hover:border-muted-foreground/30"

*                   className="group relative cursor-pointer overflow-visible rounded-lg border border-transparent bg-card p-2 transition hover:border-muted-foreground/30"
                  >

-                    <div className="mb-2 truncate text-base font-medium text-foreground">
-                      {set.name}
-                    </div>

*                    <div className="mb-2 flex items-center justify-between gap-2">
*                      <div className="truncate text-base font-medium text-foreground">
*                        {set.name}
*                      </div>
*                      {/* Delete inside the category card header (not floating on the card) */}
*                      <button
*                        title="Delete collection"
*                        onClick={(e) => {
*                          e.stopPropagation();
*                          deleteSet(e as unknown as MouseEvent, set);
*                        }}
*                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
*                        aria-label="Delete collection"
*                      >
*                        <Trash2 className="h-4 w-4" />
*                      </button>
*                    </div>

                   {previewImages.length ? (

-                    <div className="overflow-hidden">
-                      <div className="grid grid-cols-5 gap-0">

*                    <div className="rounded-xl overflow-hidden">
*                      <div className="grid grid-cols-5 gap-0">
                         {previewImages.map((image, index) => (
                           <div
                             key={image.id ?? `${set.id}-${index}`}
                             className={cn(

-                              "relative h-24 overflow-hidden md:h-32 lg:h-40",

*                              "relative h-24 overflow-hidden md:h-32 lg:h-40",
                               index === 0 && "rounded-l-lg",
                               index === previewImages.length - 1 &&
                                 "rounded-r-lg",
                             )}
                           >
                             <img
                               src={image.url}
                               alt={`${set.name} preview ${index + 1}`}

-                              className="block h-full w-full object-cover transition-opacity group-hover:opacity-80"

*                              className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                               loading="lazy"
                             />
                           </div>
                         ))}
                       </div>
                     </div>
                   ) : (
                     <div className="text-xs text-muted-foreground">
                       No preview images available
                     </div>
                   )}

-                  {/* Runder roter Delete-Button als Floating-Action in der Ecke */}
-                  <button
-                    title="Delete collection"
-                    onClick={(e) => deleteSet(e as unknown as MouseEvent, set)}
-                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow transition group-hover:opacity-100 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
-                  >
-                    {/* lucide-trash Icon wird via Tailwind im SVG gestylt */}
-                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
-                      <path d="M3 6h18" />
-                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
-                      <path d="M10 11v6" />
-                      <path d="M14 11v6" />
-                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
-                    </svg>
-                  </button>
                  </div>
                );
              })}

             <button
               type="button"
               onClick={() => setCreating(true)}

-              className="group flex h-40 w-full items-center justify-center rounded-lg border-4 border-dashed bg-card p-2 text-sm text-muted-foreground transition hover:border-muted-foreground/60 hover:text-foreground"

*              className="group flex w-full items-center justify-center rounded-xl border-2 border-dashed bg-card p-2 text-sm text-muted-foreground transition hover:border-muted-foreground/60 hover:text-foreground h-24 md:h-32 lg:h-40"
               >
                 <div className="flex items-center gap-2">
                   <Plus className="h-4 w-4" />
                   Create collection
                 </div>
               </button>
             </div>
           </ScrollArea>
         )}
  @@
  }
  **\_ End Patch
  **_ Begin Patch
  _\*\* Update File: src/app/dashboard/image-collections/page.tsx
  @@
  -"use client";
  +"use client";

-import type { MouseEvent } from "react";
+import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
-import { Plus } from "lucide-react";
+import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
@@
return (

<div className="w-full px-10 py-12 space-y-6">
<div className="flex items-center justify-between">
<h1 className="text-2xl font-semibold">My Image Collections</h1>

-        <Button
-          onClick={() => setCreating(true)}
-          className="gap-2 rounded-full px-4"
-        >
-          <Plus className="h-4 w-4" />
-          Add
-        </Button>

*        <Button
*          onClick={() => setCreating(true)}
*          variant="ghost"
*          className="h-9 gap-2 rounded-xl border px-3 shadow-sm hover:bg-muted/60"
*        >
*          <Plus className="h-4 w-4" />
*          New collection
*        </Button>
         </div>
  @@

-          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

*          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
             {mySets.map((set) => {
                const previewImages = getPreviewImages(set);

                return (
                  <div
                    key={set.id}
                    onClick={() => handleOpen(set)}

-                   className="group relative cursor-pointer overflow-visible rounded-lg border border-transparent bg-card p-2 transition hover:border-muted-foreground/30"

*                   className="group relative cursor-pointer overflow-visible rounded-lg border border-transparent bg-card p-2 transition hover:border-muted-foreground/30"
                  >

-                    <div className="mb-2 truncate text-base font-medium text-foreground">
-                      {set.name}
-                    </div>

*                    <div className="mb-2 flex items-center justify-between gap-2">
*                      <div className="truncate text-base font-medium text-foreground">
*                        {set.name}
*                      </div>
*                      {/* Delete inside the category card header (not floating on the card) */}
*                      <button
*                        title="Delete collection"
*                        onClick={(e) => {
*                          e.stopPropagation();
*                          deleteSet(e as unknown as MouseEvent, set);
*                        }}
*                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
*                        aria-label="Delete collection"
*                      >
*                        <Trash2 className="h-4 w-4" />
*                      </button>
*                    </div>

                   {previewImages.length ? (

-                    <div className="overflow-hidden">
-                      <div className="grid grid-cols-5 gap-0">

*                    <div className="rounded-xl overflow-hidden">
*                      <div className="grid grid-cols-5 gap-0">
                         {previewImages.map((image, index) => (
                           <div
                             key={image.id ?? `${set.id}-${index}`}
                             className={cn(

-                              "relative h-24 overflow-hidden md:h-32 lg:h-40",

*                              "relative h-24 overflow-hidden md:h-32 lg:h-40",
                               index === 0 && "rounded-l-lg",
                               index === previewImages.length - 1 &&
                                 "rounded-r-lg",
                             )}
                           >
                             <img
                               src={image.url}
                               alt={`${set.name} preview ${index + 1}`}

-                              className="block h-full w-full object-cover transition-opacity group-hover:opacity-80"

*                              className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                               loading="lazy"
                             />
                           </div>
                         ))}
                       </div>
                     </div>
                   ) : (
                     <div className="text-xs text-muted-foreground">
                       No preview images available
                     </div>
                   )}

-                  {/* Runder roter Delete-Button als Floating-Action in der Ecke */}
-                  <button
-                    title="Delete collection"
-                    onClick={(e) => deleteSet(e as unknown as MouseEvent, set)}
-                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow transition group-hover:opacity-100 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
-                  >
-                    {/* lucide-trash Icon wird via Tailwind im SVG gestylt */}
-                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
-                      <path d="M3 6h18" />
-                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
-                      <path d="M10 11v6" />
-                      <path d="M14 11v6" />
-                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
-                    </svg>
-                  </button>
                  </div>
                );
              })}

             <button
               type="button"
               onClick={() => setCreating(true)}

-              className="group flex h-40 w-full items-center justify-center rounded-lg border-4 border-dashed bg-card p-2 text-sm text-muted-foreground transition hover:border-muted-foreground/60 hover:text-foreground"

*              className="group flex w-full items-center justify-center rounded-xl border-2 border-dashed bg-card p-2 text-sm text-muted-foreground transition hover:border-muted-foreground/60 hover:text-foreground h-24 md:h-32 lg:h-40"
               >
                 <div className="flex items-center gap-2">
                   <Plus className="h-4 w-4" />
                   Create collection
                 </div>
               </button>
             </div>
           </ScrollArea>
         )}
  @@
  }
  **\_ End Patch
  **_ Begin Patch
  _\*\* Update File: src/app/dashboard/image-collections/page.tsx
  @@
  -"use client";
  +"use client";

-import type { MouseEvent } from "react";
+import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
-import { Plus } from "lucide-react";
+import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
@@
return (

<div className="w-full px-10 py-12 space-y-6">
<div className="flex items-center justify-between">
<h1 className="text-2xl font-semibold">My Image Collections</h1>

-        <Button
-          onClick={() => setCreating(true)}
-          className="gap-2 rounded-full px-4"
-        >
-          <Plus className="h-4 w-4" />
-          Add
-        </Button>

*        <Button
*          onClick={() => setCreating(true)}
*          variant="ghost"
*          className="h-9 gap-2 rounded-xl border px-3 shadow-sm hover:bg-muted/60"
*        >
*          <Plus className="h-4 w-4" />
*          New collection
*        </Button>
         </div>
  @@

-          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

*          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
             {mySets.map((set) => {
                const previewImages = getPreviewImages(set);

                return (
                  <div
                    key={set.id}
                    onClick={() => handleOpen(set)}

-                   className="group relative cursor-pointer overflow-visible rounded-lg border border-transparent bg-card p-2 transition hover:border-muted-foreground/30"

*                   className="group relative cursor-pointer overflow-visible rounded-lg border border-transparent bg-card p-2 transition hover:border-muted-foreground/30"
                  >

-                    <div className="mb-2 truncate text-base font-medium text-foreground">
-                      {set.name}
-                    </div>

*                    <div className="mb-2 flex items-center justify-between gap-2">
*                      <div className="truncate text-base font-medium text-foreground">
*                        {set.name}
*                      </div>
*                      {/* Delete inside the category card header (not floating on the card) */}
*                      <button
*                        title="Delete collection"
*                        onClick={(e) => {
*                          e.stopPropagation();
*                          deleteSet(e as unknown as MouseEvent, set);
*                        }}
*                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
*                        aria-label="Delete collection"
*                      >
*                        <Trash2 className="h-4 w-4" />
*                      </button>
*                    </div>

                   {previewImages.length ? (

-                    <div className="overflow-hidden">
-                      <div className="grid grid-cols-5 gap-0">

*                    <div className="rounded-xl overflow-hidden">
*                      <div className="grid grid-cols-5 gap-0">
                         {previewImages.map((image, index) => (
                           <div
                             key={image.id ?? `${set.id}-${index}`}
                             className={cn(

-                              "relative h-24 overflow-hidden md:h-32 lg:h-40",

*                              "relative h-24 overflow-hidden md:h-32 lg:h-40",
                               index === 0 && "rounded-l-lg",
                               index === previewImages.length - 1 &&
                                 "rounded-r-lg",
                             )}
                           >
                             <img
                               src={image.url}
                               alt={`${set.name} preview ${index + 1}`}

-                              className="block h-full w-full object-cover transition-opacity group-hover:opacity-80"

*                              className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                               loading="lazy"
                             />
                           </div>
                         ))}
                       </div>
                     </div>
                   ) : (
                     <div className="text-xs text-muted-foreground">
                       No preview images available
                     </div>
                   )}

-                  {/* Runder roter Delete-Button als Floating-Action in der Ecke */}
-                  <button
-                    title="Delete collection"
-                    onClick={(e) => deleteSet(e as unknown as MouseEvent, set)}
-                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow transition group-hover:opacity-100 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
-                  >
-                    {/* lucide-trash Icon wird via Tailwind im SVG gestylt */}
-                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
-                      <path d="M3 6h18" />
-                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
-                      <path d="M10 11v6" />
-                      <path d="M14 11v6" />
-                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
-                    </svg>
-                  </button>
                  </div>
                );
              })}

             <button
               type="button"
               onClick={() => setCreating(true)}

-              className="group flex h-40 w-full items-center justify-center rounded-lg border-4 border-dashed bg-card p-2 text-sm text-muted-foreground transition hover:border-muted-foreground/60 hover:text-foreground"

*              className="group flex w-full items-center justify-center rounded-xl border-2 border-dashed bg-card p-2 text-sm text-muted-foreground transition hover:border-muted-foreground/60 hover:text-foreground h-24 md:h-32 lg:h-40"
               >
                 <div className="flex items-center gap-2">
                   <Plus className="h-4 w-4" />
                   Create collection
                 </div>
               </button>
             </div>
           </ScrollArea>
         )}
  @@
  }
  **\_ End Patch
  **_ Begin Patch
  _\*\* Update File: src/app/dashboard/image-collections/page.tsx
  @@
  -"use client";
  +"use client";

-import type { MouseEvent } from "react";
+import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
-import { Plus } from "lucide-react";
+import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
@@
return (

<div className="w-full px-10 py-12 space-y-6">
<div className="flex items-center justify-between">
<h1 className="text-2xl font-semibold">My Image Collections</h1>

-        <Button
-          onClick={() => setCreating(true)}
-          className="gap-2 rounded-full px-4"
-        >
-          <Plus className="h-4 w-4" />
-          Add
-        </Button>

*        <Button
*          onClick={() => setCreating(true)}
*          variant="ghost"
*          className="h-9 gap-2 rounded-xl border px-3 shadow-sm hover:bg-muted/60"
*        >
*          <Plus className="h-4 w-4" />
*          New collection
*        </Button>
         </div>
  @@

-          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

*          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
             {mySets.map((set) => {
                const previewImages = getPreviewImages(set);

                return (
                  <div
                    key={set.id}
                    onClick={() => handleOpen(set)}

-                   className="group relative cursor-pointer overflow-visible rounded-lg border border-transparent bg-card p-2 transition hover:border-muted-foreground/30"

*                   className="group relative cursor-pointer overflow-visible rounded-lg border border-transparent bg-card p-2 transition hover:border-muted-foreground/30"
                  >

-                    <div className="mb-2 truncate text-base font-medium text-foreground">
-                      {set.name}
-                    </div>

*                    <div className="mb-2 flex items-center justify-between gap-2">
*                      <div className="truncate text-base font-medium text-foreground">
*                        {set.name}
*                      </div>
*                      {/* Delete inside the category card header (not floating on the card) */}
*                      <button
*                        title="Delete collection"
*                        onClick={(e) => {
*                          e.stopPropagation();
*                          deleteSet(e as unknown as MouseEvent, set);
*                        }}
*                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
*                        aria-label="Delete collection"
*                      >
*                        <Trash2 className="h-4 w-4" />
*                      </button>
*                    </div>

                   {previewImages.length ? (

-                    <div className="overflow-hidden">
-                      <div className="grid grid-cols-5 gap-0">

*                    <div className="rounded-xl overflow-hidden">
*                      <div className="grid grid-cols-5 gap-0">
                         {previewImages.map((image, index) => (
                           <div
                             key={image.id ?? `${set.id}-${index}`}
                             className={cn(

-                              "relative h-24 overflow-hidden md:h-32 lg:h-40",

*                              "relative h-24 overflow-hidden md:h-32 lg:h-40",
                               index === 0 && "rounded-l-lg",
                               index === previewImages.length - 1 &&
                                 "rounded-r-lg",
                             )}
                           >
                             <img
                               src={image.url}
                               alt={`${set.name} preview ${index + 1}`}

-                              className="block h-full w-full object-cover transition-opacity group-hover:opacity-80"

*                              className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                               loading="lazy"
                             />
                           </div>
                         ))}
                       </div>
                     </div>
                   ) : (
                     <div className="text-xs text-muted-foreground">
                       No preview images available
                     </div>
                   )}

-                  {/* Runder roter Delete-Button als Floating-Action in der Ecke */}
-                  <button
-                    title="Delete collection"
-                    onClick={(e) => deleteSet(e as unknown as MouseEvent, set)}
-                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow transition group-hover:opacity-100 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
-                  >
-                    {/* lucide-trash Icon wird via Tailwind im SVG gestylt */}
-                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
-                      <path d="M3 6h18" />
-                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
-                      <path d="M10 11v6" />
-                      <path d="M14 11v6" />
-                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
-                    </svg>
-                  </button>
                  </div>
                );
              })}

             <button
               type="button"
               onClick={() => setCreating(true)}

-              className="group flex h-40 w-full items-center justify-center rounded-lg border-4 border-dashed bg-card p-2 text-sm text-muted-foreground transition hover:border-muted-foreground/60 hover:text-foreground"

*              className="group flex w-full items-center justify-center rounded-xl border-2 border-dashed bg-card p-2 text-sm text-muted-foreground transition hover:border-muted-foreground/60 hover:text-foreground h-24 md:h-32 lg:h-40"
               >
                 <div className="flex items-center gap-2">
                   <Plus className="h-4 w-4" />
                   Create collection
                 </div>
               </button>
             </div>
           </ScrollArea>
         )}
  @@
  }
  \*\*\_ End Patch
