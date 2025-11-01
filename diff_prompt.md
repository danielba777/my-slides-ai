Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: next.config.js
@@
await import("./src/env.js");

/\*_ @type {import("next").NextConfig} _/
const config = {

- experimental: {
- // reduziert Bundle-Größe & Startzeit bei großen Libs
- optimizePackageImports: ["lucide-react", "framer-motion", "@tanstack/react-query"],
- },
  images: {
- // moderne, kleinere Formate aktivieren
- formats: ["image/avif", "image/webp"],
- // CDN/Browser dürfen lange cachen
- minimumCacheTTL: 31536000,
  remotePatterns: [
  {
  protocol: "https",
  hostname: "lh3.googleusercontent.com",
  },
  @@
  {
  protocol: "https",
  hostname: "r2-us-west.photoai.com",
  },
  ],
  },
- async headers() {
- return [
-      // Statische Next-Assets: 1 Jahr immutable
-      {
-        source: "/_next/static/(.*)",
-        headers: [
-          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
-        ],
-      },
-      // Eigene statische Dateien (falls verwendet)
-      {
-        source: "/(.*\\.(?:js|css|woff2?|otf|ttf|png|jpg|jpeg|webp|avif|gif|svg))",
-        headers: [
-          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
-        ],
-      },
-      // API der Hero-Library: kurz cachen + SWR
-      {
-        source: "/api/slideshow-library/posts",
-        headers: [
-          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=86400" },
-        ],
-      },
- ];
- },
  };

export default config;
\*\*\* End Patch

codebase

diff
Code kopieren
**_ Begin Patch
_** Update File: src/app/layout.tsx
@@
return (

<html lang="en" suppressHydrationWarning>
<head>
<meta name="color-scheme" content="light dark" />

-        {/* Netzwerk-Warmups für Bild-CDNs */}
-        <meta httpEquiv="x-dns-prefetch-control" content="on" />
-        <link rel="dns-prefetch" href="https://images.unsplash.com" />
-        <link rel="dns-prefetch" href="https://files.slidescockpit.com" />
-        <link rel="dns-prefetch" href="https://r2-us-west.photoai.com" />
-        <link rel="dns-prefetch" href="https://placehold.co" />
-        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
-        <link rel="dns-prefetch" href="https://ufs.sh" />
-
-        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
-        <link rel="preconnect" href="https://files.slidescockpit.com" crossOrigin="anonymous" />
-        <link rel="preconnect" href="https://r2-us-west.photoai.com" crossOrigin="anonymous" />
-        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
         </head>
         <body
           className={`${tiktokSans.variable} font-sans antialiased bg-[#F3F4EF]`}
           suppressHydrationWarning
         >
  @@

*        {/* ESM + Fallback */}
*        <Script
*          type="module"
*          src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"
*        />
*        <Script
*          noModule
*          src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"
*        />

-        {/* Icons erst nach LCP laden */}
-        <Script
-          type="module"
-          src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"
-          strategy="lazyOnload"
-        />
-        <Script
-          noModule
-          src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"
-          strategy="lazyOnload"
-        />
         </body>
       </html>
  );
  }
  \*\*\* End Patch

codebase

diff
Code kopieren
**_ Begin Patch
_** Update File: src/components/marketing/Hero.tsx
@@
-const HERO_POSTER_ROWS = 8;
-const HERO_POSTERS_PER_ROW = 28;
-const HERO_FETCH_LIMIT = 300;
+// Reduziert anfängliche Bildflut deutlich (weniger Requests, schnellerer Paint)
+const HERO_POSTER_ROWS = 5;
+const HERO_POSTERS_PER_ROW = 16;
+const HERO_FETCH_LIMIT = 120;
@@

-        setPosterImages(deduped);

*        // Nur so viele Bilder rendern, wie auch sichtbar sind
*        setPosterImages(deduped.slice(0, HERO_POSTER_ROWS * HERO_POSTERS_PER_ROW));
  \*\*\* End Patch
