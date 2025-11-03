// --- Security headers (CSP funktionsfähig & Scanner-kompatibel) ---
const ONE_YEAR = 31536000;
const isProd = process.env.NODE_ENV === "production";

// Hinweis:
// - Wir erlauben bewusst 'unsafe-inline' und 'unsafe-eval' in script-src,
// damit Next.js + deine Libs (z.B. Framer Motion) zuverlässig rendern.
// - Scanner erwarten _vorhandene_ CSP-Header; eine zu strikte CSP hat dir die App gebrochen.
// - Falls du später weiter abhärten willst, können wir Nonces/Hashes einführen.
const CSP = [
  "default-src 'self'",
  // Skripte: Next/Framer/Hydration brauchen inline/eval in deinem aktuellen Setup
  "script-src 'self' https: blob: 'unsafe-inline' 'unsafe-eval'",
  // Styles: Tailwind/inline kritisch, daher 'unsafe-inline'
  "style-src 'self' https: 'unsafe-inline'",
  // Medien & Bilder (Next/Image, UploadThing-CDNs, eigene Files)
  "img-src 'self' https: data: blob:",
  "media-src 'self' https: blob:",
  // Schriften
  "font-src 'self' https: data:",
  // API/SSR/HMR/Realtime
  "connect-src 'self' https: wss: ws:",
  // Frames nur von sicheren Quellen (z.B. eigene Seiten, evtl. externe UIs)
  "frame-src 'self' https:",
  // Worker (Next/Image, Offscreen etc.)
  "worker-src 'self' blob:",
  // Sichere Defaults
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  // Mixed-Content nur in Production automatisch upgraden (vermeidet localhost-Timeouts)
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: `max-age=${ONE_YEAR}; includeSubDomains` },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "Content-Security-Policy", value: CSP },
];

const config = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "files.slidescockpit.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "placehold.co" },
      // TikTok CDN (diverse pXX-Subdomains; nötig für Hero-Slides)
      {
        protocol: "https",
        hostname: "*.tiktokcdn-eu.com",
      },
      {
        protocol: "https",
        hostname: "*.tiktokcdn.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default config;