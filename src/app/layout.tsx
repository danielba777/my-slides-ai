import TanstackQueryProvider from "@/components/providers/TanstackQueryProvider";
import { ToasterProvider } from "@/components/providers/ToasterProvider";
import NextAuthProvider from "@/provider/NextAuthProvider";
import { ThemeProvider } from "@/provider/theme-provider";
import "@/styles/globals.css";
import { type Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { Amplitude } from "./amplitude";

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
    /* Nutze die stabile dynamische OG-Route statt toter PNG-Referenzen */
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
  twitter: {
    card: "summary_large_image",
    title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
    description:
      "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
    images: ["/opengraph-image"],
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
      </head>
      <Amplitude />
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
          crossOrigin="anonymous"
        />
        <Script
          noModule
          src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
