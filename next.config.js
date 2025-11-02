/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  images: {
    // Moderne, kleinere Formate aktivieren
    formats: ["image/avif", "image/webp"],
    // CDN/Browser dürfen lange cachen
    minimumCacheTTL: 31536000,
    // Ab Next.js 16 müssen verwendete Qualitäten whitelisted sein
    qualities: [60, 75, 85, 90, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "files.slidescockpit.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  async headers() {
    // CSP dev-freundlich (React Refresh & Blob) und in Prod strikt genug.
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'", // für Inline-Metadata/ionicons bootstrap
      "https://unpkg.com", // ionicons
      isDev ? "'unsafe-eval'" : null, // React Refresh in dev
      "blob:", // Web-Worker/Blob URLs
    ]
      .filter(Boolean)
      .join(" ");

    const styleSrc = ["'self'", "'unsafe-inline'"].join(" ");
    const imgSrc = [
      "'self'",
      "data:",
      "blob:",
      "https://lh3.googleusercontent.com",
      "https://images.unsplash.com",
      "https://placehold.co",
      "https://*.ufs.sh",
      "https://utfs.io",
      "https://files.slidescockpit.com",
    ].join(" ");
    const fontSrc = ["'self'", "data:"].join(" ");
    const connectSrc = [
      "'self'",
      "https://slidescockpit.com",
      "https://*.ufs.sh",
      "https://utfs.io",
      "https://images.unsplash.com",
      isDev ? "ws:" : null, // next dev websocket
    ]
      .filter(Boolean)
      .join(" ");

    const csp = [
      `default-src 'self'`,
      `script-src ${scriptSrc}`,
      `style-src ${styleSrc}`,
      `img-src ${imgSrc}`,
      `font-src ${fontSrc}`,
      `connect-src ${connectSrc}`,
      `frame-ancestors 'self'`,
      // optional: falls ihr <iframe> extern einbettet, hier erweitern (frame-src ...)
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default config;
