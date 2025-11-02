Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: next.config.js
@@
await import("./src/env.js");

/\*_ @type {import("next").NextConfig} _/
const config = {
images: {

- // moderne, kleinere Formate aktivieren

* // Moderne, kleinere Formate aktivieren
  formats: ["image/avif", "image/webp"],
  // CDN/Browser dürfen lange cachen
  minimumCacheTTL: 31536000,
* // Ab Next.js 16 müssen verwendete Qualitäten whitelisted sein
* qualities: [60, 75, 85, 90, 100],
  remotePatterns: [
  {
  protocol: "https",
  hostname: "lh3.googleusercontent.com",
  },
  {
  protocol: "https",
  hostname: "files.slidescockpit.com",
  },
*      {
*        protocol: "https",
*        hostname: "images.unsplash.com",
*      },
*      {
*        protocol: "https",
*        hostname: "placehold.co",
*      },
*      {
*        protocol: "https",
*        hostname: "*.ufs.sh",
*      },
*      {
*        protocol: "https",
*        hostname: "utfs.io",
*      },
  ],
  },
* async headers() {
* // CSP dev-freundlich (React Refresh & Blob) und in Prod strikt genug.
* const isDev = process.env.NODE_ENV !== "production";
* const scriptSrc = [
*      "'self'",
*      "'unsafe-inline'", // für Inline-Metadata/ionicons bootstrap
*      "https://unpkg.com", // ionicons
*      isDev ? "'unsafe-eval'" : null, // React Refresh in dev
*      "blob:", // Web-Worker/Blob URLs
* ]
*      .filter(Boolean)
*      .join(" ");
*
* const styleSrc = ["'self'", "'unsafe-inline'"].join(" ");
* const imgSrc = [
*      "'self'",
*      "data:",
*      "blob:",
*      "https://lh3.googleusercontent.com",
*      "https://images.unsplash.com",
*      "https://placehold.co",
*      "https://*.ufs.sh",
*      "https://utfs.io",
*      "https://files.slidescockpit.com",
* ].join(" ");
* const fontSrc = ["'self'", "data:"].join(" ");
* const connectSrc = [
*      "'self'",
*      "https://slidescockpit.com",
*      "https://*.ufs.sh",
*      "https://utfs.io",
*      "https://images.unsplash.com",
*      isDev ? "ws:" : null, // next dev websocket
* ]
*      .filter(Boolean)
*      .join(" ");
*
* const csp = [
*      `default-src 'self'`,
*      `script-src ${scriptSrc}`,
*      `style-src ${styleSrc}`,
*      `img-src ${imgSrc}`,
*      `font-src ${fontSrc}`,
*      `connect-src ${connectSrc}`,
*      `frame-ancestors 'self'`,
*      // optional: falls ihr <iframe> extern einbettet, hier erweitern (frame-src ...)
* ].join("; ");
*
* return [
*      {
*        source: "/(.*)",
*        headers: [
*          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
*          { key: "X-Content-Type-Options", value: "nosniff" },
*          { key: "X-Frame-Options", value: "SAMEORIGIN" },
*          { key: "Content-Security-Policy", value: csp },
*        ],
*      },
* ];
* },
  };

export default config;
**_ End Patch
diff
Code kopieren
_** Begin Patch
\*\*\* Update File: src/app/layout.tsx
@@
import { type Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";

@@
-export const metadata: Metadata = {

- title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
- description:
- "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
  -};
  +export const metadata: Metadata = {

* metadataBase: new URL("https://slidescockpit.com"),
* title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
* description:
* "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
* alternates: { canonical: "/" },
* openGraph: {
* type: "website",
* url: "https://slidescockpit.com/",
* siteName: "SlidesCockpit",
* title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
* description:
*      "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
* images: [
*      {
*        // Du kannst später ein dediziertes 1200x630 OG-Bild hinterlegen
*        url: "https://slidescockpit.com/favicon.ico",
*        width: 1200,
*        height: 630,
*        alt: "SlidesCockpit",
*      },
* ],
* },
* twitter: {
* card: "summary_large_image",
* site: "@ArluOfficial",
* creator: "@ArluOfficial",
* title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
* description:
*      "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
* images: ["https://slidescockpit.com/favicon.ico"],
* },
* robots: { index: true, follow: true },
* icons: { icon: "/favicon.ico" },
  +};
  @@
  return (
  <html lang="en" suppressHydrationWarning>
  <head>
  <meta name="color-scheme" content="light dark" />
*        {/* JSON-LD: Organization */}
*        <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">
*          {JSON.stringify({
*            "@context": "https://schema.org",
*            "@type": "Organization",
*            name: "SlidesCockpit",
*            url: "https://slidescockpit.com/",
*            logo: "https://slidescockpit.com/favicon.ico",
*          })}
*        </Script>
*        {/* JSON-LD: Website */}
*        <Script id="ld-website" type="application/ld+json" strategy="afterInteractive">
*          {JSON.stringify({
*            "@context": "https://schema.org",
*            "@type": "WebSite",
*            name: "SlidesCockpit",
*            url: "https://slidescockpit.com/",
*            potentialAction: {
*              "@type": "SearchAction",
*              target: "https://slidescockpit.com/?q={search_term_string}",
*              "query-input": "required name=search_term_string",
*            },
*          })}
*        </Script>
         </head>
         <body
           className={`${tiktokSans.variable} font-sans antialiased bg-[#F3F4EF]`}
           suppressHydrationWarning
         >
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/components/marketing/Hero.tsx
  @@

-      <h3 className=""
-      >Live in seconds</h3>

*      <h2 className=""
*      >Live in seconds</h2>
  @@

-      <h3 className=""
-      >Templates that convert</h3>

*      <h2 className=""
*      >Templates that convert</h2>
  @@

-      <h3 className=""
-      >Looks handcrafted</h3>

*      <h2 className=""
*      >Looks handcrafted</h2>
  **_ End Patch
  diff
  Code kopieren
  _** Begin Patch
  \*\*\* Update File: src/components/logo/AppLogo.tsx
  @@
  <Image
  src={logoSrc}
  alt="SlidesCockpit logo"
  width={750}
  height={750}

-        quality={100}

*        quality={85}
           priority={typeof size === "number" && size <= 64}
           className="h-full w-full object-contain"
         />
  \*\*\* End Patch
