import NextAuthProvider from "@/provider/NextAuthProvider";
import TanStackQueryProvider from "@/provider/TanstackProvider";
import { ThemeProvider } from "@/provider/theme-provider";
import "@/styles/globals.css";
import { type Metadata } from "next";
import localFont from "next/font/local";

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
  title: "SlidesCockpit - Make TikTok Slides & Automate Marketing",
  description:
    "Automated slideshows that drive traffic to your website, app, or business. Generate AI TikToks and create your own gen z marketing team.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <TanStackQueryProvider>
      <NextAuthProvider>
        <html lang="en" suppressHydrationWarning>
          <head>
            {/* sorgt dafür, dass Browser das richtige Farbschema kennt */}
            <meta name="color-scheme" content="light dark" />
          </head>
          <body
            className={`${tiktokSans.variable} font-sans antialiased`}
            suppressHydrationWarning
          >
            {/* next-themes setzt die Klasse ("dark"/"light") auf <html> clientseitig */}
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </body>
        </html>
      </NextAuthProvider>
    </TanStackQueryProvider>
  );
}
