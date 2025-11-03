import TanstackQueryProvider from "@/components/providers/TanstackQueryProvider";
import { ToasterProvider } from "@/components/providers/ToasterProvider";
import NextAuthProvider from "@/provider/NextAuthProvider";
import { ThemeProvider } from "@/provider/theme-provider";
import "@/styles/globals.css";
import { type Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";

const tiktokSans = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    {
      path: "../fonts/tiktok/TikTokDisplayRegular.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/tiktok/TikTokTextRegular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/tiktok/TikTokTextMedium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/tiktok/TikTokDisplayMedium.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/tiktok/TikTokDisplayBold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/tiktok/TikTokTextBold.otf",
      weight: "800",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://slidescockpit.com"),
  title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
  description:
    "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://slidescockpit.com/",
    siteName: "SlidesCockpit",
    title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
    description:
      "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
    images: [
      {
        url: "https://slidescockpit.com/favicon.ico",
        width: 1200,
        height: 630,
        alt: "SlidesCockpit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@ArluOfficial",
    creator: "@ArluOfficial",
    title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
    description:
      "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
    images: ["https://slidescockpit.com/favicon.ico"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />

        {/* JSON-LD: Organization + Website */}
        <Script
          id="ld-org"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "SlidesCockpit",
            url: "https://slidescockpit.com/",
            logo: "https://slidescockpit.com/favicon.ico",
          })}
        </Script>
        <Script
          id="ld-website"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "SlidesCockpit",
            url: "https://slidescockpit.com/",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://slidescockpit.com/?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          })}
        </Script>
      </head>
      <body
        className={`${tiktokSans.variable} font-sans antialiased bg-[#F3F4EF]`}
        suppressHydrationWarning
      >
        <TanstackQueryProvider>
          <NextAuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              disableTransitionOnChange
            >
              {children}
              <ToasterProvider />
            </ThemeProvider>
          </NextAuthProvider>
        </TanstackQueryProvider>

        {/* ESM + Fallback */}
        <Script
          type="module"
          src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"
        />
        <Script
          noModule
          src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"
        />
      </body>
    </html>
  );
}
