Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/app/layout.tsx
@@
openGraph: {
type: "website",
url: "https://slidescockpit.com/",
siteName: "SlidesCockpit",
title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
description:
"Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",

- images: ["https://slidescockpit.com/favicon.ico"],

* images: [
*      // Primär: großes Logo-Bild für Social Cards
*      { url: "/logo-og.png", width: 1200, height: 630, alt: "SlidesCockpit Logo" },
*      // Fallback: bestehendes Favicon, falls logo-og.png (noch) fehlt
*      { url: "/favicon.ico", width: 256, height: 256, alt: "SlidesCockpit Favicon" },
* ],
  },
  robots: {
  index: true,
  follow: true,
  },
  icons: {
  icon: "/favicon.ico",
  },
* twitter: {
* card: "summary_large_image",
* title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
* description:
*      "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
* images: ["/logo-og.png", "/favicon.ico"],
* },
  };
  \*\*\* End Patch
