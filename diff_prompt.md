Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: next.config.js
@@
images: {
// moderne, kleinere Formate aktivieren
formats: ["image/avif", "image/webp"],
// CDN/Browser dürfen lange cachen
minimumCacheTTL: 31536000,
remotePatterns: [

-      // SlidesCockpit Files CDN (Hero-Poster/Thumbnails)
-      {
-        protocol: "https",
-        hostname: "files.slidescockpit.com",
-      },
-      // UploadThing / UFS (falls in der Library vorhanden)
-      {
-        protocol: "https",
-        hostname: "ufs.sh",
-      },
-      {
-        protocol: "https",
-        hostname: "utfs.io",
-      },
         {
           protocol: "https",
           hostname: "lh3.googleusercontent.com",
         },
         {
  \*\*\* End Patch
  Optional (empfohlen, ändert nichts Funktionales außer Last): setze bei den kleinen Hero-Postern zusätzlich unoptimized und loading="lazy" (falls noch nicht gesetzt). Beispiel – nur auf die Thumbnail-Images, nicht auf große Hero-Bilder:

diff
Code kopieren
**_ Begin Patch
_** Update File: src/components/marketing/Hero.tsx
@@

-                      <Image

*                      <Image
                         src={imageUrl}
                         alt=""
                         fill
*                        unoptimized
*                        loading="lazy"
                           className="object-cover"
                         />
  \*\*\* End Patch
