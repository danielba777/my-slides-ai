import { NextResponse } from "next/server";

/**
 * Force-correct XML sitemap with proper Content-Type.
 * This overrides any fallback that might return text/html on HEAD.
 */
export async function GET() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://slidescockpit.com");

  const now = new Date().toISOString();

  const urls = [
    { loc: `${base}/`,          changefreq: "weekly",  priority: "1.0", lastmod: now },
    { loc: `${base}/pricing`,   changefreq: "monthly", priority: "0.8", lastmod: now },
    { loc: `${base}/privacy`,   changefreq: "yearly",  priority: "0.3", lastmod: now },
    { loc: `${base}/terms`,     changefreq: "yearly",  priority: "0.3", lastmod: now },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

export async function HEAD() {
  // Return only headers with the correct MIME type for Search Console
  return new NextResponse(null, {
    status: 200,
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}