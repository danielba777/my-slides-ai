Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

1. src/components/presentation/dashboard/ImageCollectionSelector.tsx
   \*\*\* a/src/components/presentation/dashboard/ImageCollectionSelector.tsx
   --- b/src/components/presentation/dashboard/ImageCollectionSelector.tsx
   @@

-        <DialogContent
-          className="
-            sm:max-w-[900px]
-            w-[92vw] sm:w-auto
-            h-auto max-h-[85vh]
-            p-0 overflow-hidden flex flex-col
-            rounded-2xl
-            shadow-xl
-            border border-border/30
-          "
-        >

*        <DialogContent
*          className="
*            w-[92vw] sm:w-[900px] lg:w-[1000px]     /* feste Breite wie bei 'max' */
*            h-[85vh] max-h-[85vh]                   /* feste Höhe wie bei 'max' */
*            p-0 overflow-hidden flex flex-col
*            rounded-2xl shadow-xl border border-border/30
*          "
*        >
  @@

-          {/* Scrollbarer Mittelteil */}
-          <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain">

*          {/* Scrollbarer Mittelteil (behält feste Außenmaße bei) */}
*          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 overscroll-contain">
             <Tabs
               value={activeTab}
               onValueChange={(value) =>
                 setActiveTab(value as "community" | "mine")
               }

-              className="flex flex-col min-h-0"

*              className="flex flex-col min-h-0"
             >

2. src/components/presentation/presentation-page/SingleSlideImageSelector.tsx
   \*\*\* a/src/components/presentation/presentation-page/SingleSlideImageSelector.tsx
   --- b/src/components/presentation/presentation-page/SingleSlideImageSelector.tsx
   @@

-      <DialogContent
-        className="
-          sm:max-w-[720px]
-          h-[640px] max-h-[85vh]
-          p-0 overflow-hidden
-          flex flex-col
-        "
-      >

*      <DialogContent
*        className="
*          w-[92vw] sm:w-[900px] lg:w-[1000px]
*          h-[85vh] max-h-[85vh]
*          p-0 overflow-hidden flex flex-col
*          rounded-2xl shadow-xl border border-border/30
*        "
*      >
  @@

-        {/* Scrollbarer Mittelteil */}
-        <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain">

*        {/* Scrollbarer Mittelteil */}
*        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 overscroll-contain">
           {selectedSet ? (
             <div className="mt-2">
               {renderImageSelection()}
             </div>
           ) : (
             <Tabs
               value={activeTab}
               onValueChange={(value) =>
                 setActiveTab(value as "community" | "mine")
               }

-              className="flex flex-col min-h-0"

*              className="flex flex-col min-h-0"
             >

3. src/components/presentation/presentation-page/MultiSlideImageSelector.tsx
   \*\*\* a/src/components/presentation/presentation-page/MultiSlideImageSelector.tsx
   --- b/src/components/presentation/presentation-page/MultiSlideImageSelector.tsx
   @@

-      <DialogContent
-        className="
-          sm:max-w-[720px]
-          h-[640px] max-h-[85vh]
-          p-0 overflow-hidden
-          flex flex-col
-        "
-      >

*      <DialogContent
*        className="
*          w-[92vw] sm:w-[900px] lg:w-[1000px]
*          h-[85vh] max-h-[85vh]
*          p-0 overflow-hidden flex flex-col
*          rounded-2xl shadow-xl border border-border/30
*        "
*      >
  @@

-        {/* Scrollbarer Mittelteil */}
-        <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain">

*        {/* Scrollbarer Mittelteil */}
*        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 overscroll-contain">
           {selectedSet ? (
             <div className="mt-2">
               {renderImageSelection()}
             </div>
           ) : (
             <Tabs
               value={activeTab}
               onValueChange={(value) =>
                 setActiveTab(value as "community" | "mine")
               }

-              className="flex flex-col min-h-0"

*              className="flex flex-col min-h-0"
             >
