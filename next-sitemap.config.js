/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: "https://slidescockpit.com",
  generateRobotsTxt: true,
  sitemapSize: 7000,

  exclude: [
    "/admin",
    "/admin/**",
    "/dashboard",
    "/dashboard/**",
    "/auth/**",
    "/api/**",
    "/_next/**",
  ],

  changefreq: "daily",
  priority: 0.7,

  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
  // Saubere, scanner-freundliche robots.txt
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
    ],
    additionalSitemaps: ["https://slidescockpit.com/sitemap.xml"],
  },
};

export default config;
