/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Erlaubte Qualitätsstufen, damit quality={30|60|75} etc. problemlos sind
    qualities: [30, 40, 60, 75],
    remotePatterns: [
      { protocol: "https", hostname: "files.slidescockpit.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "ufs.sh" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Keine custom headers -> vermeidet "headers field cannot be empty"
};

export default nextConfig;
