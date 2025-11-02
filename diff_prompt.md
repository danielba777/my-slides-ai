Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

_ Begin Patch
_ Update File: next.config.js

@@
-// --- Security headers (CSP funktionsfähig & Scanner-kompatibel) ---
-const ONE_YEAR = 31536000;
+// --- Security headers (CSP funktionsfähig & Scanner-kompatibel) ---
+const ONE_YEAR = 31536000;
+const isProd = process.env.NODE_ENV === "production";
@@
-const CSP = [

- "default-src 'self'",
- // Skripte: Next/Framer/Hydration brauchen inline/eval in deinem aktuellen Setup
- "script-src 'self' https: blob: 'unsafe-inline' 'unsafe-eval'",
- // Styles: Tailwind/inline Kritisch, daher 'unsafe-inline'
- "style-src 'self' https: 'unsafe-inline'",
- // Medien & Bilder (Next/Image, UploadThing-CDNs, eigene Files)
- "img-src 'self' https: data: blob:",
- "media-src 'self' https: blob:",
- // Schriften
- "font-src 'self' https: data:",
- // API/SSR/HMR/Realtime
- "connect-src 'self' https: wss: ws:",
- // Frames nur von sicheren Quellen (z.B. eigene Seiten, evtl. externe UIs)
- "frame-src 'self' https:",
- // Worker (Next/Image, Offscreen etc.)
- "worker-src 'self' blob:",
- // Sichere Defaults
- "object-src 'none'",
- "base-uri 'self'",
- "form-action 'self'",
- "frame-ancestors 'self'",
- // Mixed-Content vermeiden
- "upgrade-insecure-requests",
  -].join("; ");
  +const CSP = [

* "default-src 'self'",
* // Skripte: Next/Framer/Hydration brauchen inline/eval in deinem aktuellen Setup
* "script-src 'self' https: blob: 'unsafe-inline' 'unsafe-eval'",
* // Styles: Tailwind/inline kritisch, daher 'unsafe-inline'
* "style-src 'self' https: 'unsafe-inline'",
* // Medien & Bilder (Next/Image, UploadThing-CDNs, eigene Files)
* "img-src 'self' https: data: blob:",
* "media-src 'self' https: blob:",
* // Schriften
* "font-src 'self' https: data:",
* // API/SSR/HMR/Realtime
* "connect-src 'self' https: wss: ws:",
* // Frames nur von sicheren Quellen (z.B. eigene Seiten, evtl. externe UIs)
* "frame-src 'self' https:",
* // Worker (Next/Image, Offscreen etc.)
* "worker-src 'self' blob:",
* // Sichere Defaults
* "object-src 'none'",
* "base-uri 'self'",
* "form-action 'self'",
* "frame-ancestors 'self'",
* // Mixed-Content nur in Production automatisch upgraden (vermeidet localhost-Timeouts)
* ...(isProd ? ["upgrade-insecure-requests"] : []),
  +].join("; ");

\_ End Patch
