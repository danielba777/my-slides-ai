Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/app/api/apify/run/route.ts
@@
-export async function POST(request: Request) {

- if (!process.env.APIFY_API_KEY) {
- throw new Error("APIFY_API_KEY is not set");
- }
  +// Avoid hard-failing during build/route evaluation:
  +// Only check the env at request time and respond gracefully.
  +export const dynamic = "force-dynamic";

* +export async function POST(request: Request) {
* const token = process.env.APIFY_API_KEY;
* if (!token) {
* return new Response(
*      JSON.stringify({ error: "APIFY_API_KEY is not configured on the server" }),
*      { status: 500, headers: { "content-type": "application/json" } },
* );
* }

  const body = await request.json();
  const url = body.url as string;
  if (!url) {
  return new Response("Missing `url`", { status: 400 });
  }

  const res = await fetch(
  "https://api.apify.com/v2/actor-tasks/apify~web-scraper/run-sync?timeout=120000",
  {
  method: "POST",
  headers: {
  "Content-Type": "application/json",

-        Authorization: `Bearer ${process.env.APIFY_API_KEY}`,

*        Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({
           startUrls: [{ url }],
         }),
       },
  );
  if (!res.ok) {
  return new Response("Apify request failed", { status: 502 });
  }
  const data = await res.json();
  return new Response(JSON.stringify(data), {
  headers: { "content-type": "application/json" },
  });
  }
  **_ End Patch
  _** Begin Patch
  \*\*\* Update File: src/components/logo/AppLogo.tsx
  @@
  return (
  <div
  className={cn(
  "relative flex items-center justify-center overflow-hidden rounded-lg",
  className,
  )}

-      style={{ width: dimension, height: dimension, .borderRadiusStyle }}

*      style={{ width: dimension, height: dimension, ...borderRadiusStyle }}
       aria-label="SlidesCockpit logo"
  >
       <Image
         src={logoSrc}
         alt="SlidesCockpit logo"
         width={750}
         height={750}

-        quality={100}

*        /* kleinere Datei = schnellere LCP */
*        quality={75}
           priority={typeof size === "number" && size <= 64}
           className="h-full w-full object-contain"
         />
       </div>
  );
  }
  **_ End Patch
  _** Begin Patch
  \*\*\* Update File: src/app/layout.tsx
  @@
  export const metadata: Metadata = {
  title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
  description:
  "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",

- openGraph: {
- title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
- description:
-      "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
- images: [
-      // Primär: großes Logo-Bild für Social Cards
-      { url: "/logo-og.png", width: 1200, height: 630, alt: "SlidesCockpit Logo" },
-      // Fallback: bestehendes Favicon, falls logo-og.png (noch) fehlt
-      { url: "/favicon.ico", width: 256, height: 256, alt: "SlidesCockpit Favicon" },
- ],
- },

* openGraph: {
* title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
* description:
*      "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
* /_ Nutze die stabile dynamische OG-Route statt toter PNG-Referenzen _/
* images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
* },
  robots: {
  index: true,
  follow: true,
  },
  icons: {
  icon: "/favicon.ico",
  },

- twitter: {
- card: "summary_large_image",
- title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
- description:
-      "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
- images: ["/logo-og.png", "/favicon.ico"],
- },

* twitter: {
* card: "summary_large_image",
* title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
* description:
*      "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
* images: ["/opengraph-image"],
* },
  };
  **_ End Patch
  _** Begin Patch
  \*\*\* Add File: src/app/robots.ts
  +import type { MetadataRoute } from "next";
* +export default function robots(): MetadataRoute.Robots {
* return {
* rules: [
*      {
*        userAgent: "*",
*        allow: "/",
*      },
* ],
* sitemap: "https://slidescockpit.com/sitemap.xml",
* host: "https://slidescockpit.com",
* };
  +}
  \*\*\* End Patch
